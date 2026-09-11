import { z } from "zod";
import { vision, parseJson } from "@/lib/ai/groq";
import { VISION_MAX_PAGES_PER_REQUEST } from "@/lib/ai/models";
import { cached } from "@/lib/cache";
import { looseNumber, looseString } from "./loose";
import type { PageImage, Question } from "@/lib/types";

const RawQuestion = z.object({
  number: looseString(""),
  text: looseString(""),
  marks: looseNumber.optional(),
  group: z.string().nullable().optional().catch(null),
  chooseCount: looseNumber.optional(),
});

// One malformed question must not drop the rest of the paper.
const RawPayload = z.object({
  subject: z.string().nullable().optional().catch(null),
  questions: z.array(z.unknown()).transform((list) =>
    list.flatMap((item) => {
      const parsed = RawQuestion.safeParse(item);
      return parsed.success && parsed.data.number.trim() && parsed.data.text.trim() ? [parsed.data] : [];
    })
  ),
});

const PROMPT = `You are reading a printed school examination paper.

Extract EVERY question, in the exact order printed on the page.

Rules, all of them mandatory:
1. Copy the question number EXACTLY as printed - "7", "11 (a)", "3(ii)", "Q4".
   Never renumber, never convert to a sequence of your own.
2. A labelled sub-part is a SEPARATE question. "11 (a)" and "11 (b)" are two
   entries, never one. Do the same for (i)/(ii) sub-parts.
3. If a question has a shared stem followed by sub-parts, put the stem text at
   the start of the FIRST sub-part so each entry stands on its own.
4. Copy the question text in full. Do not summarise, shorten or rephrase it.
5. Capture the marks shown in brackets like [5] or (3 marks) as a number.
   Use null when no marks are printed.
6. Ignore headers, instructions, "End of paper" notices and page numbers.
   They are not questions.
7. Watch for choice instructions - "attempt any TWO of the following",
   "answer any 2 out of 3", "(any two)", "Q7 OR Q8". Give every question in
   such a choice the SAME "group" name and set "chooseCount" to how many of
   them count. Leave both null when a question is compulsory.
   Only set a group when the paper actually offers a choice: treating
   compulsory sub-parts as optional would silently discard a student's marks.
8. "subject": the school subject the paper is for, such as "Biology",
   "Physics", "History" or "Mathematics".

Return ONLY this JSON:
{"subject":"Biology","questions":[{"number":"11 (a)","text":"full question text","marks":3}]}`;

export interface QuestionPaper {
  questions: Question[];
  /** What the paper looks like to the model; only used to warn about a wrong class. */
  subject: string | null;
}

export function normaliseLabel(raw: string): string {
  return raw
    .trim()
    .replace(/^(?:q(?:uestion)?\s*\.?\s*)/i, "")
    .replace(/[.\s)]+$/, "")
    .replace(/[()\s.]/g, "")
    .toLowerCase();
}

export function parentOf(normalised: string): string | null {
  const m = /^(\d+)[a-z]+$/i.exec(normalised);
  return m ? m[1] : null;
}

/** Questions and subject from one pass over the paper (one call per three pages). */
export async function readQuestionPaper(
  pages: PageImage[],
  onProgress?: (done: number, total: number) => void
): Promise<QuestionPaper> {
  const batchCount = Math.ceil(pages.length / VISION_MAX_PAGES_PER_REQUEST);

  const paper = await cached(
    "questions",
    [PROMPT, pages.map((p) => p.dataUrl)],
    () => readPaper(pages, onProgress)
  );

  onProgress?.(batchCount, batchCount);
  return paper;
}

export async function extractQuestions(
  pages: PageImage[],
  onProgress?: (done: number, total: number) => void
): Promise<Question[]> {
  return (await readQuestionPaper(pages, onProgress)).questions;
}

async function readPaper(
  pages: PageImage[],
  onProgress?: (done: number, total: number) => void
): Promise<QuestionPaper> {
  const out: Question[] = [];
  let subject: string | null = null;
  const seen = new Set<string>();
  const batches = Math.ceil(pages.length / VISION_MAX_PAGES_PER_REQUEST);
  let batchesDone = 0;

  for (let i = 0; i < pages.length; i += VISION_MAX_PAGES_PER_REQUEST) {
    const batch = pages.slice(i, i + VISION_MAX_PAGES_PER_REQUEST);
    const raw = await vision({
      prompt:
        batch.length > 1
          ? `${PROMPT}\n\nYou are given ${batch.length} consecutive pages. Treat them as one continuous paper and keep the questions in reading order across them.`
          : PROMPT,
      images: batch.map((p) => p.dataUrl),
      maxTokens: 1200,
    });

    onProgress?.(++batchesDone, batches);

    const parsed = RawPayload.safeParse(parseJson(raw));
    if (!parsed.success) continue;
    subject ??= parsed.data.subject?.trim() || null;

    for (const q of parsed.data.questions) {
      const number = normaliseLabel(q.number);
      if (!number || seen.has(number)) continue;
      seen.add(number);

      out.push({
        group: typeof q.group === "string" && q.group ? q.group : null,
        chooseCount:
          typeof q.chooseCount === "number" && q.chooseCount > 0
            ? q.chooseCount
            : null,
        number,
        display: q.number.trim().replace(/^q\.?\s*/i, "").replace(/[.\s]+$/, ""),
        printedOrder: out.length,
        text: q.text.trim(),
        maxMarks: typeof q.marks === "number" ? q.marks : null,
        parent: parentOf(number),
      });
    }
  }

  return { questions: out.map((q, i) => ({ ...q, printedOrder: i })), subject };
}
