import { z } from "zod";
import { chat, parseJson } from "@/lib/ai/groq";
import { peek, store } from "@/lib/cache";
import { MARK_UNLABELLED_ANSWERS } from "../mapping";
import {
  DIAGRAM_TEXT_ONLY_CAP,
  formatMark,
  isWeighted,
  roundMark,
  scoreFromCoverage,
  scoreFromWeights,
  type MarkScheme,
} from "@/lib/marks";
import { applyChoiceGroups, paperMaxMarks } from "./choiceGroups";
import { evidencePool, normalise, quoteIsSupported } from "./evidence";
import { gradingSystem, judging, LARGE_MODEL_FROM_MARKS, TOKENS_PER_QUESTION, type Lane } from "./prompts";
import { normaliseLabel } from "../questions";

/** Up to four answers per call: 4 x 950 output tokens stays under the cap for each call. */
const MAX_ANSWERS_PER_CALL = 4;
/** Keeps the prompt of one batched call to roughly 3,000 tokens. */
const MAX_INPUT_CHARS_PER_CALL = 12_000;
import { DEMO_CONTEXT, type ExamContext } from "../context";
import { RawGrade, RawPayload } from "./schema";
import { summarise } from "./summary";
import type {
  AnswerBlock,
  Grade,
  Mapping,
  Question,
  Summary,
  Verdict,
} from "@/lib/types";

export interface GradingResult {
  grades: Grade[];
  summary: Summary;
  warnings: string[];
}

export async function gradeAll({
  questions,
  answers,
  mappings,
  unmatchedAnswerIds,
  rubric,
  onProgress,
  context = DEMO_CONTEXT,
}: {
  questions: Question[];
  answers: AnswerBlock[];
  mappings: Mapping[];
  unmatchedAnswerIds: string[];
  rubric?: Map<string, MarkScheme>;
  onProgress?: (done: number, total: number) => void;
  context?: ExamContext;
}): Promise<GradingResult> {
  const SYSTEM = gradingSystem(context);
  const JUDGING = judging(context);
  const answerById = new Map(answers.map((a) => [a.id, a]));
  const questionByNumber = new Map(questions.map((q) => [q.number, q]));
  const attempted = mappings.filter((m) => m.answerId);
  const warnings: string[] = [];

  const payload = attempted.map((m) => {
    const q = questionByNumber.get(m.questionNumber)!;
    const scheme = rubric?.get(q.number);

    return {
      questionNumber: q.number,
      question: q.text,
      maxMarks: q.maxMarks ?? 5,
      answerType: scheme?.answerType ?? "explain",
      requiresDiagram: scheme?.requiresDiagram ?? false,
      diagramLabels: scheme?.diagramLabels ?? [],
      checklist: (scheme?.points ?? []).map((p, i) => ({
        index: i,
        text: p.text,
        kind: p.kind,
        essential: p.essential,
      })),
      studentAnswer: answerById.get(m.answerId!)?.text ?? "",
      studentDrewADiagram: answerById.get(m.answerId!)?.hasDiagram ?? false,
      labelsOnTheDrawing: answerById.get(m.answerId!)?.diagramLabels ?? [],
    };
  });

  const collected = new Map<string, z.infer<typeof RawGrade>>();
  type Job = (typeof payload)[number];

  const keyFor = (job: Job) => [SYSTEM, JUDGING, job];

  const laneOf = (job: Job): Lane =>
    job.maxMarks >= LARGE_MODEL_FROM_MARKS ? "reason" : "fast";

  /**
   * Marks several answers in one call. Each keeps its own cache entry, so a
   * later run (or a retry) only sends the answers that are not cached yet.
   * Returns the question numbers that came back marked.
   */
  const runBatch = async (jobs: Job[], lane: Lane): Promise<Set<string>> => {
    const marked = new Set<string>();
    if (jobs.length === 0) return marked;

    try {
      const res = await chat({
        role: lane,
        json: true,
        maxTokens: TOKENS_PER_QUESTION * jobs.length,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Mark ${jobs.length === 1 ? "this answer" : `each of these ${jobs.length} answers on its own`}. For every checklist item an answer covers, give the item's index and a short quote from THAT answer. Never use one answer as evidence for another question.

${JSON.stringify(jobs, null, 1)}

${JUDGING}

Return ONLY this JSON, with one entry per question:
{"grades":[{"questionNumber":"${jobs[0].questionNumber}","covered":[{"index":0,"quote":"exact words from the student"}],"feedback":"...","diagramUnverified":false,"illegible":false,"resultCorrect":false,"workingShown":false,"answerQuality":0.6}]}`,
          },
        ],
      });

      const parsed = RawPayload.safeParse(parseJson(res));
      if (!parsed.success) return marked;

      const byNumber = new Map(jobs.map((j) => [j.questionNumber, j]));
      for (const grade of parsed.data.grades) {
        const number = normaliseLabel(grade.questionNumber);
        const job =
          byNumber.get(number) ?? (jobs.length === 1 && parsed.data.grades.length === 1 ? jobs[0] : undefined);
        if (!job || marked.has(job.questionNumber)) continue;

        const value = { ...grade, questionNumber: job.questionNumber };
        collected.set(job.questionNumber, value);
        marked.add(job.questionNumber);
        await store("grading", keyFor(job), value);
      }
    } catch {
      // Unmarked answers fall through to the retry below.
    }
    return marked;
  };

  /** Groups answers so each call stays inside the model's token budget for each minute. */
  const toBatches = (jobs: Job[]): Job[][] => {
    const batches: Job[][] = [];
    let current: Job[] = [];
    let chars = 0;
    for (const job of jobs) {
      const size = JSON.stringify(job).length;
      if (current.length > 0 && (current.length >= MAX_ANSWERS_PER_CALL || chars + size > MAX_INPUT_CHARS_PER_CALL)) {
        batches.push(current);
        current = [];
        chars = 0;
      }
      current.push(job);
      chars += size;
    }
    if (current.length > 0) batches.push(current);
    return batches;
  };

  let done = 0;
  const lanes: Lane[] = ["reason", "fast"];

  await Promise.all(
    lanes.map(async (lane) => {
      const pending: Job[] = [];
      for (const job of payload.filter((j) => laneOf(j) === lane)) {
        const hit = await peek<z.infer<typeof RawGrade>>("grading", keyFor(job));
        if (hit) {
          collected.set(job.questionNumber, hit);
          onProgress?.(++done, payload.length);
        } else {
          pending.push(job);
        }
      }

      for (const batch of toBatches(pending)) {
        const first = await runBatch(batch, lane);
        let missing = batch.filter((j) => !first.has(j.questionNumber));

        // One retry for whatever did not come back, together, on the other model.
        if (missing.length > 0) {
          const second = await runBatch(missing, lane === "reason" ? "fast" : "reason");
          missing = missing.filter((j) => !second.has(j.questionNumber));
        }

        for (const job of missing) {
          warnings.push(
            `Question ${job.questionNumber} could not be marked automatically, so it is flagged for you to mark by hand.`
          );
        }

        done += batch.length;
        onProgress?.(Math.min(done, payload.length), payload.length);
      }
    })
  );

  let unsupportedTotal = 0;

  const graded: Grade[] = mappings.map((m) => {
    const q = questionByNumber.get(m.questionNumber)!;
    const max = q.maxMarks;

    if (!m.answerId) {
      return {
        questionNumber: q.number,
        score: 0,
        maxMarks: max,
        verdict: "unattempted" as Verdict,
        feedback: "Not attempted.",
        counted: true,
        needsReview: false,
      };
    }

    const g = collected.get(q.number);
    const scheme = rubric?.get(q.number);

    if (!g) {
      return {
        questionNumber: q.number,
        score: 0,
        maxMarks: max,
        verdict: "incorrect" as Verdict,
        feedback: "Answer located, but marking was unavailable for this question.",
        counted: true,
        needsReview: true,
        reviewNote: "Not marked automatically. Please mark this one by hand.",
      };
    }

    if (g.illegible) {
      return {
        questionNumber: q.number,
        score: 0,
        maxMarks: max,
        verdict: "partial" as Verdict,
        feedback: g.feedback.trim(),
        counted: true,
        needsReview: true,
        reviewNote:
          "The handwriting could not be read reliably. Please mark this one by hand.",
      };
    }

    const ceiling = max ?? 5;
    const points = scheme?.points ?? [];

    const inferredMatch = Boolean(m.answerId) && m.source !== null && m.source !== "label";
    const answer = answerById.get(m.answerId);
    const studentAnswer = evidencePool(answer);

    const claims = (
      g.covered.length > 0
        ? g.covered
        : g.coveredPoints.map((index) => ({ index, quote: "" }))
    ).filter((c) => c.index >= 0 && c.index < points.length);

    const quotesOffered = claims.filter((c) => c.quote.trim().length > 0).length;
    const covered = new Set<number>();
    let unsupported = 0;

    for (const claim of claims) {
      if (quotesOffered === 0 || quoteIsSupported(claim.quote, studentAnswer)) {
        covered.add(claim.index);
      } else {
        unsupported += 1;
      }
    }
    unsupportedTotal += unsupported;

    let score =
      points.length === 0
        ? roundMark(ceiling * g.answerQuality, ceiling)
        : isWeighted(scheme)
          ? scoreFromWeights({ covered, points, maxMarks: ceiling })
          : scoreFromCoverage({
            covered: covered.size,
            total: points.length,
            essentialMissed: points.some((p, i) => p.essential && !covered.has(i)),
            maxMarks: ceiling,
          });

    const allEvidenceRejected =
      claims.length >= 2 &&
      unsupported === claims.length &&
      normalise(studentAnswer).length >= 40;
    if (allEvidenceRejected) {
      score = Math.max(
        score,
        roundMark(Math.min(ceiling * g.answerQuality, ceiling * 0.5), ceiling)
      );
    }

    if ((scheme?.answerType ?? "") === "numerical" && g.resultCorrect) {
      const demandsWorking = /show(?:ing)?\s+(?:your\s+)?working|step[- ]by[- ]step|in detail|detailed/i.test(
        q.text
      );
      const floor = !demandsWorking || g.workingShown ? ceiling : ceiling * 0.7;
      score = Math.max(score, roundMark(floor, ceiling));
    }

    const drew = Boolean(answer?.hasDiagram);
    const diagramMissing = Boolean(scheme?.requiresDiagram) && !drew;
    if (diagramMissing) {
      score = Math.min(score, roundMark(ceiling * DIAGRAM_TEXT_ONLY_CAP, ceiling));
    }

    score = roundMark(score, ceiling);

    const unnumbered = !MARK_UNLABELLED_ANSWERS && inferredMatch;
    const wouldHaveScored = score;
    if (unnumbered) score = 0;

    const evidenceThin = quotesOffered === 0 && claims.length > 0;
    const evidenceRejected = unsupported > 0 && unsupported >= claims.length / 2;

    const reviewNote = allEvidenceRejected
      ? "None of the credited points could be traced back to the script, so this mark is provisional. Please set it yourself."
      : unnumbered
        ? `No question number was written for this answer. It has not been credited. It was matched to this question by what it says${m.note ? ` (${m.note})` : ""}, and would have scored ${formatMark(wouldHaveScored)}/${ceiling} if you accept it.`
      : inferredMatch
        ? `The student did not number this answer. It was matched to this question by what it says${m.note ? ` (${m.note})` : ""}. Confirm before accepting the mark.`
      : diagramMissing
      ? "Marked on the written answer only, as no drawing was found for a question that asks for one."
      : drew && Boolean(scheme?.requiresDiagram)
        ? "A diagram was drawn and credited. Worth a glance to confirm it is accurate."
        : evidenceRejected
        ? "Some credited points could not be traced back to the script. Worth a look."
        : evidenceThin
          ? "Marked without evidence quotes for this one. Worth a check."
          : points.length === 0
            ? "Marked without a scheme for this question. Worth a check."
            : undefined;

    return {
      questionNumber: q.number,
      score,
      maxMarks: max,
      verdict:
        score === 0 ? "incorrect" : score >= ceiling ? "correct" : "partial",
      feedback: unnumbered
        ? `No question number was written for this answer, so it has not been credited. ${g.feedback.trim()}`
        : g.feedback.trim(),
      counted: true,
      needsReview: Boolean(reviewNote),
      reviewNote,
    };
  });

  const grades = applyChoiceGroups(graded, questions);

  const score = grades.reduce((sum, g) => (g.counted ? sum + (g.score ?? 0) : sum), 0);
  const maxScore = paperMaxMarks(questions);
  const unattempted = grades.filter((g) => g.verdict === "unattempted").length;
  const notCounted = grades.filter((g) => !g.counted).length;

  if (notCounted > 0) {
    warnings.push(
      `${notCounted} extra ${notCounted === 1 ? "attempt was" : "attempts were"} marked but not counted, because the paper offers a choice and only the best attempts contribute to the total.`
    );
  }

  if (unsupportedTotal > 0) {
    warnings.push(
      `${unsupportedTotal} credited ${unsupportedTotal === 1 ? "point" : "points"} could not be traced to the script and ${unsupportedTotal === 1 ? "was" : "were"} not counted.`
    );
  }

  const overallFeedback = await summarise(grades, questions, score, maxScore);

  return {
    warnings,
    grades,
    summary: {
      questionCount: questions.length,
      attempted: questions.length - unattempted,
      unattempted,
      unmatchedAnswers: unmatchedAnswerIds.length,
      score,
      maxScore,
      overallFeedback,
    },
  };
}

