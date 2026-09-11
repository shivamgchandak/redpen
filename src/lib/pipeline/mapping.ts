import { z } from "zod";
import { chat, parseJson } from "@/lib/ai/groq";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

const STOP = new Set(
  ("the a an and or of in to for is are was were be been it its this that these those with " +
   "which what how why when where name state give explain describe draw label list define " +
   "write briefly following two three one your answer question marks mark using use").split(" ")
);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function buildIdf(questions: Question[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const q of questions) {
    for (const t of new Set(tokens(q.text))) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  const n = Math.max(1, questions.length);
  for (const [t, d] of df) idf.set(t, Math.log(1 + n / d));
  return idf;
}

function similarity(a: string, b: string, idf: Map<string, number>): number {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;

  let dot = 0;
  for (const t of ta) if (tb.has(t)) dot += (idf.get(t) ?? 1) ** 2;

  const norm = (s: Set<string>) =>
    Math.sqrt([...s].reduce((acc, t) => acc + (idf.get(t) ?? 1) ** 2, 0));

  return dot / (norm(ta) * norm(tb) || 1);
}

const LEXICAL_ACCEPT = 0.45;
const LEXICAL_CONSIDER = 0.12;

const LEXICAL_MARGIN = 0.15;

export const MARK_UNLABELLED_ANSWERS = false;

const Arbitration = z.object({
  matches: z.array(
    z.object({
      answerId: z.string(),
      questionNumber: z.union([z.string(), z.null()]),
      confidence: z.number().min(0).max(1),
    })
  ),
});

export interface MappingResult {
  mappings: Mapping[];
  unmatchedAnswerIds: string[];
  warnings: string[];
}

export async function mapAnswers(
  questions: Question[],
  answers: AnswerBlock[]
): Promise<MappingResult> {
  const byQuestion = new Map<string, Mapping>(
    questions.map((q) => [
      q.number,
      { questionNumber: q.number, answerId: null, confidence: 0, source: null },
    ])
  );
  const takenAnswers = new Set<string>();
  const questionNumbers = new Set(questions.map((q) => q.number));
  const warnings: string[] = [];

  for (const answer of answers) {
    if (!answer.writtenLabel) continue;
    const target = byQuestion.get(answer.writtenLabel);
    if (target && !target.answerId) {
      target.answerId = answer.id;
      target.confidence = 0.99;
      target.source = "label";
      takenAnswers.add(answer.id);
    }
  }

  const idf = buildIdf(questions);
  const loose = answers.filter((a) => !takenAnswers.has(a.id));

  type Candidate = { answerId: string; questionNumber: string; score: number };
  const candidates: Candidate[] = [];

  const evidence = new Map<string, string>();

  for (const answer of loose) {
    const scored = questions
      .filter((q) => !byQuestion.get(q.number)?.answerId)
      .map((q) => ({ q, score: similarity(answer.text, q.text, idf) }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const runnerUp = scored[1];
    if (!best || best.score < LEXICAL_CONSIDER) continue;

    const margin = best.score - (runnerUp?.score ?? 0);
    if (best.score >= LEXICAL_ACCEPT && margin < LEXICAL_MARGIN) {
      warnings.push(
        `An unnumbered answer could be question ${best.q.number} or question ${runnerUp?.q.number}, so it was not assigned automatically.`
      );
      continue;
    }

    evidence.set(
      answer.id,
      runnerUp
        ? `${best.score.toFixed(2)} match, next closest is question ${runnerUp.q.number} at ${runnerUp.score.toFixed(2)}`
        : `${best.score.toFixed(2)} match`
    );

    for (const { q, score } of scored) {
      if (score >= LEXICAL_CONSIDER) {
        candidates.push({ answerId: answer.id, questionNumber: q.number, score });
      }
    }
  }

  candidates.sort((x, y) => y.score - x.score);
  for (const c of candidates) {
    if (c.score < LEXICAL_ACCEPT) break;
    const mapping = byQuestion.get(c.questionNumber);
    if (!mapping || mapping.answerId || takenAnswers.has(c.answerId)) continue;
    mapping.answerId = c.answerId;
    mapping.confidence = Math.min(0.95, c.score);
    mapping.source = "lexical";
    mapping.note = evidence.get(c.answerId);
    takenAnswers.add(c.answerId);
  }

  const stillLoose = answers.filter((a) => !takenAnswers.has(a.id));
  const stillOpen = questions.filter((q) => !byQuestion.get(q.number)?.answerId);

  if (stillLoose.length > 0 && stillOpen.length > 0) {
    try {
      const raw = await chat({
        role: "reason",
        json: true,
        messages: [
          {
            role: "system",
            content:
              "You match a student's answers to the questions they answer. You are strict: an answer that does not clearly address any listed question must be returned with questionNumber null. Reply only with JSON.",
          },
          {
            role: "user",
            content: `Unanswered questions:
${JSON.stringify(stillOpen.map((q) => ({ number: q.number, text: q.text })))}

Unmatched answers:
${JSON.stringify(stillLoose.map((a) => ({ answerId: a.id, text: a.text })))}

Assign at most one question to each answer, and never the same question twice.
An answer that addresses none of them gets questionNumber null.
Return {"matches":[{"answerId":"a3","questionNumber":"8","confidence":0.0}]}`,
          },
        ],
      });

      const parsed = Arbitration.safeParse(parseJson(raw));
      if (parsed.success) {
        for (const m of parsed.data.matches) {
          if (!m.questionNumber || !questionNumbers.has(m.questionNumber)) continue;
          const mapping = byQuestion.get(m.questionNumber);
          if (!mapping || mapping.answerId || takenAnswers.has(m.answerId)) continue;
          if (m.confidence < 0.5) continue;
          mapping.answerId = m.answerId;
          mapping.confidence = m.confidence;
          mapping.source = "llm";
          takenAnswers.add(m.answerId);
        }
      }
    } catch (err) {
      warnings.push(
        `AI arbitration for ${stillLoose.length} unmatched ${stillLoose.length === 1 ? "answer" : "answers"} was unavailable (${err instanceof Error ? err.message : String(err)}).`
      );
    }
  }

  if (!MARK_UNLABELLED_ANSWERS) {
    for (const mapping of byQuestion.values()) {
      if (mapping.answerId && mapping.source !== "label") {
        warnings.push(
          `Question ${mapping.questionNumber} was answered without a question number, so it has not been credited.`
        );
      }
    }
  }

  return {
    warnings,
    mappings: questions.map((q) => byQuestion.get(q.number)!),
    unmatchedAnswerIds: answers.filter((a) => !takenAnswers.has(a.id)).map((a) => a.id),
  };
}
