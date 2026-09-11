import { z } from "zod";
import { chat, parseJson, vision } from "@/lib/ai/groq";
import { VISION_MAX_PAGES_PER_REQUEST } from "@/lib/ai/models";
import { cached } from "@/lib/cache";
import type { MarkScheme } from "@/lib/marks";
import type { PageImage, Question } from "@/lib/types";
import { DEMO_CONTEXT, levelOf, type ExamContext } from "./context";
import { normaliseLabel } from "./questions";
import { buildRubric } from "./rubric";
import { looseNumber, looseString } from "./loose";

/**
 * The teacher's own rubric wins. It is read once per test, lined up with the
 * questions by label (the same normaliser the answer mapping uses), and only
 * the questions it does not cover get a generated scheme.
 */

const RawPoint = z.object({
  text: looseString(""),
  marks: looseNumber.optional(),
});

const RawEntry = z.object({
  question: looseString(""),
  totalMarks: looseNumber.optional(),
  points: z.array(RawPoint).catch([]).default([]),
  modelAnswer: z.string().nullable().optional().catch(null),
});

// One bad entry must not throw away the rest of the page.
const RawPayload = z.object({
  entries: z
    .array(z.unknown())
    .transform((list) =>
      list.flatMap((item) => {
        const parsed = RawEntry.safeParse(item);
        return parsed.success && parsed.data.question.trim() ? [parsed.data] : [];
      })
    ),
});
type Entry = z.infer<typeof RawEntry>;

const PROMPT = `This is a teacher's marking scheme (a rubric or answer key) for a school exam paper.

Extract the marking guidance for EVERY question, in the order printed.

Rules, all of them mandatory:
1. "question": the question number exactly as printed, like "7", "11 (a)", "Q3(ii)".
   A labelled sub-part is its own entry.
2. "points": each creditable point as its own entry, in the teacher's words.
   When a mark is shown for a point ("1 mark", "[2]", "(1/2)", "½"), put it
   in "marks" as a number (½ = 0.5). Otherwise "marks" is null.
3. When the guidance is a written model answer instead of separate points,
   copy it into "modelAnswer" and leave "points" empty.
4. "totalMarks": marks for the whole question when shown, otherwise null.
5. Keep instructions like "any two of the following" inside the point text.
6. Ignore headers, page numbers and general instructions.

Return ONLY this JSON:
{"entries":[{"question":"11 (a)","totalMarks":3,"points":[{"text":"names chlorophyll","marks":1}],"modelAnswer":null}]}`;

async function readRubricPages(pages: PageImage[]): Promise<Entry[]> {
  return cached("teacherRubric", [PROMPT, pages.map((p) => p.dataUrl)], async () => {
    const entries: Entry[] = [];

    for (let i = 0; i < pages.length; i += VISION_MAX_PAGES_PER_REQUEST) {
      const batch = pages.slice(i, i + VISION_MAX_PAGES_PER_REQUEST);
      const raw = await vision({
        prompt:
          batch.length > 1
            ? `${PROMPT}\n\nYou are given ${batch.length} consecutive pages of the same scheme.`
            : PROMPT,
        images: batch.map((p) => p.dataUrl),
        maxTokens: 2400,
      });
      const parsed = RawPayload.safeParse(parseJson(raw));
      if (parsed.success) entries.push(...parsed.data.entries);
    }

    return entries;
  });
}

/** Joins entries for the same question, for example one that runs over a page break. */
function mergeByLabel(entries: Entry[]): Map<string, Entry> {
  const merged = new Map<string, Entry>();
  for (const e of entries) {
    const key = normaliseLabel(e.question);
    if (!key) continue;
    const prior = merged.get(key);
    if (!prior) {
      merged.set(key, { ...e, points: [...e.points] });
      continue;
    }
    prior.points.push(...e.points);
    prior.totalMarks ??= e.totalMarks;
    if (e.modelAnswer) {
      prior.modelAnswer = prior.modelAnswer ? `${prior.modelAnswer} ${e.modelAnswer}` : e.modelAnswer;
    }
  }
  return merged;
}

function guessAnswerType(text: string): MarkScheme["answerType"] {
  if (/\b(draw|sketch)\b|\blabel(l?ed)?\b.*\bdiagram\b|\bdiagram\b/i.test(text)) return "diagram";
  if (/\b(calculate|compute|find the value|solve|how many|how much)\b/i.test(text)) return "numerical";
  if (/\b(define|name|state|list|what is|write the)\b/i.test(text)) return "recall";
  return "explain";
}

function schemeFromPoints(q: Question, texts: { text: string; marks: number | null }[]): MarkScheme {
  const answerType = guessAnswerType(q.text);
  return {
    questionNumber: q.number,
    answerType,
    requiresDiagram: answerType === "diagram",
    diagramLabels: [],
    points: texts.map((p) => ({
      text: p.text.trim(),
      kind: "content",
      essential: false,
      marks: typeof p.marks === "number" && p.marks > 0 ? p.marks : null,
    })),
  };
}

const SplitPayload = z.object({
  schemes: z.array(z.object({ questionNumber: z.string(), points: z.array(z.string()) })),
});

/** Turns model answers into checkable points, using only what the teacher wrote. */
async function splitModelAnswers(
  items: { question: Question; modelAnswer: string }[],
  context: ExamContext
): Promise<Map<string, string[]>> {
  if (items.length === 0) return new Map();

  const payload = items.map(({ question, modelAnswer }) => ({
    questionNumber: question.number,
    question: question.text,
    maxMarks: question.maxMarks ?? 5,
    modelAnswer,
  }));

  try {
    const result = await cached("teacherRubric", ["split", levelOf(context), payload], async () => {
      const raw = await chat({
        role: "reason",
        json: true,
        maxTokens: 2400,
        messages: [
          {
            role: "system",
            content: `You are a ${levelOf(context)} examiner. You turn a teacher's model answer into a checklist of points a marker can tick. Reply only with JSON.`,
          },
          {
            role: "user",
            content: `For each question, split the teacher's model answer into short, specific, checkable points. Use ONLY content that is in the model answer. Do not add, improve or correct anything. Aim for about 1.5 points per mark.

${JSON.stringify(payload, null, 1)}

Return ONLY this JSON:
{"schemes":[{"questionNumber":"4","points":["states that ...","names ..."]}]}`,
          },
        ],
      });
      const parsed = SplitPayload.safeParse(parseJson(raw));
      return parsed.success ? parsed.data.schemes : [];
    });

    return new Map(result.map((s) => [s.questionNumber, s.points.filter((p) => p.trim())]));
  } catch {
    return new Map();
  }
}

export interface TestRubricEntry {
  questionNumber: string;
  source: "teacher" | "generated";
  scheme: MarkScheme;
}

export interface TestRubricResult {
  questions: Question[];
  entries: TestRubricEntry[];
  warnings: string[];
}

export async function buildTestRubric({
  questions,
  rubricPages,
  context = DEMO_CONTEXT,
  onProgress,
}: {
  questions: Question[];
  rubricPages: PageImage[];
  context?: ExamContext;
  onProgress?: (label: string) => void;
}): Promise<TestRubricResult> {
  const warnings: string[] = [];
  const teacher = new Map<string, MarkScheme>();
  let updated = questions;

  if (rubricPages.length > 0) {
    onProgress?.("Reading your rubric");
    const entries = mergeByLabel(await readRubricPages(rubricPages));

    // A paper without printed marks can take them from the rubric.
    updated = questions.map((q) => {
      const e = entries.get(q.number);
      return q.maxMarks === null && typeof e?.totalMarks === "number" && e.totalMarks > 0
        ? { ...q, maxMarks: e.totalMarks }
        : q;
    });

    const needsSplit: { question: Question; modelAnswer: string }[] = [];
    for (const q of updated) {
      const e = entries.get(q.number);
      if (!e) continue;
      const points = e.points.filter((p) => p.text.trim());
      if (points.length > 0) {
        teacher.set(q.number, schemeFromPoints(q, points.map((p) => ({ text: p.text, marks: p.marks ?? null }))));
      } else if (e.modelAnswer?.trim()) {
        needsSplit.push({ question: q, modelAnswer: e.modelAnswer.trim() });
      }
    }

    if (needsSplit.length > 0) {
      onProgress?.("Turning model answers into rubric points");
      const split = await splitModelAnswers(needsSplit, context);
      for (const { question } of needsSplit) {
        const points = split.get(question.number);
        if (points?.length) {
          teacher.set(question.number, schemeFromPoints(question, points.map((text) => ({ text, marks: null }))));
        }
      }
    }

    const known = new Set(updated.map((q) => q.number));
    const stray = [...entries.keys()].filter((k) => !known.has(k));
    if (stray.length > 0) {
      warnings.push(`Your rubric has guidance for ${stray.join(", ")}, which did not match any question on the paper.`);
    }
    if (teacher.size === 0) {
      warnings.push("Nothing in the uploaded rubric could be matched to the questions, so RedPen wrote the rubric.");
    }
  }

  const gaps = updated.filter((q) => !teacher.has(q.number));
  let generated = new Map<string, MarkScheme>();
  if (gaps.length > 0) {
    onProgress?.(
      teacher.size > 0
        ? `Writing rubric points for ${gaps.length} question${gaps.length === 1 ? "" : "s"} not in your rubric`
        : "Writing the rubric"
    );
    generated = await buildRubric(gaps, undefined, context).catch(() => new Map<string, MarkScheme>());
    if (teacher.size > 0) {
      warnings.push(
        `Question ${gaps.map((q) => q.display).join(", ")} ${gaps.length === 1 ? "was" : "were"} not in your rubric, so RedPen drafted ${gaps.length === 1 ? "its" : "their"} points. Check them before locking.`
      );
    }
  }

  const entries: TestRubricEntry[] = updated.flatMap((q): TestRubricEntry[] => {
    const own = teacher.get(q.number);
    if (own) return [{ questionNumber: q.number, source: "teacher", scheme: own }];
    const made = generated.get(q.number);
    return made ? [{ questionNumber: q.number, source: "generated", scheme: { ...made, questionNumber: q.number } }] : [];
  });

  const missing = updated.filter((q) => !entries.some((e) => e.questionNumber === q.number));
  if (missing.length > 0) {
    warnings.push(
      `No rubric could be drafted for question ${missing.map((q) => q.display).join(", ")}. Add points yourself before locking.`
    );
  }

  return { questions: updated, entries, warnings };
}
