import { z } from "zod";
import { chat, parseJson } from "@/lib/ai/groq";
import { peek, store } from "@/lib/cache";
import { RawScheme, schemeProblems, type MarkScheme } from "@/lib/marks";
import type { Question } from "@/lib/types";
import { DEMO_CONTEXT, levelOf, type ExamContext } from "./context";
import { normaliseLabel } from "./questions";

// One malformed scheme must not discard the rest of the batch.
const RawPayload = z.object({
  schemes: z.array(z.unknown()).transform((list) =>
    list.flatMap((item) => {
      const parsed = RawScheme.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
  ),
});

const systemFor = (ctx: ExamContext) =>
  `You are a ${levelOf(ctx)} examiner writing the marking scheme for a paper, before any scripts are marked. Reply only with JSON.`;

const RULES = `Rules:
1. For a question worth X marks, list between 1.5X and 2X checklist items.
   A 5-mark question therefore needs 8 to 10 items, a 2-mark question 3 to 4,
   a 10-mark question 15 to 20. More items than marks is deliberate: it is what
   lets a thorough answer be told apart from a bare one.
1b. Shape the checklist the way a complete answer is built:
   - the definition or the direct answer to what was asked (usually essential),
   - the important supporting detail: the mechanism, the parts, the reason,
   - an example, an application, or named values where the topic allows one,
   - and, when a drawing is asked for, the diagram and each of its labels.
2. Every item must be specific and checkable - "names chlorophyll a and
   chlorophyll b", "states that the aorta is the largest artery". Never a
   generic instruction like "explains well" or "writes in detail".
3. Mark "essential": true on the items any correct answer must contain -
   roughly X of them. The rest are the additional detail that separates a
   thorough answer from a bare one.
4. "kind": "label" for each label a required diagram must carry, "diagram" for
   the drawing itself, "working"/"unit" for the steps and units of a
   calculation, "terminology" for a term that must be used by name, otherwise
   "content".
5. "answerType": "recall" for name/state/list/define, "numerical" for
   calculations, "diagram" when a drawing is asked for, "application" for
   scenario questions, otherwise "explain".
6. Set requiresDiagram true when the student is asked to draw, sketch or label,
   and list the labels the diagram must carry.
7. Do not write a model answer. Only the items that earn credit.

Return ONLY this JSON:
{"schemes":[{"questionNumber":"6","answerType":"diagram","points":[{"text":"...","kind":"label","essential":true}],"requiresDiagram":true,"diagramLabels":["stomach"]}]}`;

// Bigger batches mean fewer calls: 20 marks of rubric fits one response.
const MARKS_PER_BATCH = 20;
const TOKENS_PER_MARK = 170;
const TOKEN_FLOOR = 1200;

// Repairs cost calls, so only badly thin schemes are redrafted, and at most two.
const MAX_REPAIRS = 2;

function batchByMarks(questions: Question[]): Question[][] {
  const batches: Question[][] = [];
  let current: Question[] = [];
  let marks = 0;

  for (const q of questions) {
    const m = q.maxMarks ?? 5;
    if (current.length > 0 && marks + m > MARKS_PER_BATCH) {
      batches.push(current);
      current = [];
      marks = 0;
    }
    current.push(q);
    marks += m;
  }
  if (current.length > 0) batches.push(current);
  return batches;
}

export async function buildRubric(
  questions: Question[],
  onProgress?: (done: number, total: number) => void,
  context: ExamContext = DEMO_CONTEXT
): Promise<Map<string, MarkScheme>> {
  const schemes = new Map<string, MarkScheme>();
  const SYSTEM = systemFor(context);

  const keyFor = (q: Question) => [SYSTEM, RULES, q.number, q.text, q.maxMarks ?? 5];

  const pending: Question[] = [];
  for (const q of questions) {
    const hit = await peek<MarkScheme>("rubric", keyFor(q));
    if (hit) schemes.set(q.number, hit);
    else pending.push(q);
  }

  const queue = batchByMarks(pending);
  const total = queue.length;
  let done = 0;

  const run = async (batch: Question[]): Promise<boolean> => {
    const budget = batch.reduce((sum, q) => sum + (q.maxMarks ?? 5), 0);
    const maxTokens = Math.max(TOKEN_FLOOR, budget * TOKENS_PER_MARK);

    try {
      const raw = await chat({
        role: "reason",
        json: true,
        maxTokens,
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Write the marking scheme for each question.

${JSON.stringify(
  batch.map((q) => ({
    questionNumber: q.number,
    question: q.text,
    maxMarks: q.maxMarks ?? 5,
  })),
  null,
  1
)}

${RULES}`,
          },

        ],
      });

      const parsed = RawPayload.safeParse(parseJson(raw));
      if (!parsed.success || parsed.data.schemes.length === 0) return false;

      // "11 (a)" and "11a" are the same question; match the way answers are matched.
      const wanted = new Set(batch.map((q) => q.number));
      for (const scheme of parsed.data.schemes) {
        const number = normaliseLabel(scheme.questionNumber);
        if (wanted.has(number)) schemes.set(number, { ...scheme, questionNumber: number });
      }
      return batch.every((q) => schemes.has(q.number));
    } catch {
      return false;
    }
  };

  for (const batch of queue) {
    const ok = await run(batch);

    if (!ok && batch.length > 1) {
      const mid = Math.ceil(batch.length / 2);
      await run(batch.slice(0, mid));
      await run(batch.slice(mid));
    }

    onProgress?.(++done, total);
  }

  const missing = pending.filter((q) => !schemes.has(q.number));
  const flawed = pending.filter((q) => {
    const scheme = schemes.get(q.number);
    // Only schemes too thin to mark with: fewer points than the question has marks.
    return scheme && scheme.points.length < Math.max(2, q.maxMarks ?? 5);
  });

  // Questions the model skipped go again together, not one call each.
  for (const batch of batchByMarks(missing)) await run(batch);

  for (const q of flawed.slice(0, MAX_REPAIRS)) {
    const scheme = schemes.get(q.number);
    const marks = q.maxMarks ?? 5;

    await run([q]);

    const retried = schemes.get(q.number);
    if (retried && schemeProblems(retried, marks).length > 0 && scheme) {
      const before = schemeProblems(scheme, marks).length;
      const after = schemeProblems(retried, marks).length;
      if (before < after) schemes.set(q.number, scheme);
    }
  }

  for (const q of pending) {
    const scheme = schemes.get(q.number);
    if (scheme) await store("rubric", keyFor(q), scheme);
  }

  return schemes;
}
