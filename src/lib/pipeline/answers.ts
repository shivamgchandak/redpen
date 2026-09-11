import { z } from "zod";
import { vision, parseJson } from "@/lib/ai/groq";
import {
  TOKENS_PER_ANSWER_PAGE_OUT,
  VISION_MAX_ANSWER_PAGES_PER_REQUEST,
} from "@/lib/ai/models";
import { cached } from "@/lib/cache";
import { normaliseLabel } from "./questions";
import type { AnswerBlock, AnswerPage, LineBox, Region } from "@/lib/types";

const RawAnswer = z.object({
  first: z.number().int().nonnegative(),
  last: z.number().int().nonnegative(),
  label: z.union([z.string(), z.null()]).optional(),
  continued: z.boolean().optional(),
  text: z.string().default(""),
  hasDiagram: z.boolean().default(false),
  diagramLabels: z.array(z.string()).default([]),
});
const RawPayload = z.object({ answers: z.array(RawAnswer) });

type RawAnswerT = z.infer<typeof RawAnswer>;

const PROMPT = `This is a student's handwritten answer sheet.

Every line of writing has a RED index label like [12] [13] [14] printed in the
left margin beside it. Use those printed labels. Do not count lines yourself.
The numbering runs on from earlier pages, so it does not start at zero.

Group the lines into ANSWERS and return them in the order they appear.

Rules, all of them mandatory:
1. For each answer give "first" and "last": the red index of its first and its
   last line. Include the line carrying the question label in the range.
2. Ignore the name/roll-number header and the page number. They are not
   answers and must not appear in any range.
3. "label": the question label the student wrote for that answer, normalised to
   digits and letters only - "Q11(b)." becomes "11b", "Ans 3." becomes "3".
   Use null when the student wrote no label.
4. START A NEW ANSWER WHENEVER THE WRITING TURNS TO A DIFFERENT QUESTION, even
   when the student wrote no number for it. A missing number is common and it
   does not join two answers into one. The signs are a new opening sentence, a
   change of subject, or a blank line - for example a paragraph about the leaf
   followed by a paragraph about transpiration is TWO answers with the second
   one unlabelled, never one long answer. When in doubt, split: an answer
   wrongly joined to the one above it is lost completely, while one wrongly
   split can still be matched.
5. An answer that carries on from one page to the next is ONE answer, not two:
   give it a single range running from its first line on the earlier page to
   its last line on the later one. Set "continued" true only when the FIRST
   answer shown here begins mid-sentence, carrying on from a page you have not
   been given.
6. "text": a verbatim transcription of the answer, its lines joined by spaces.
   Never invent, complete or correct the student's work. Transcribe the WRITING
   only - words that label a drawing go in "diagramLabels", not here.
7. "hasDiagram": true when the answer contains a DRAWING - a sketch, a figure,
   an outline, arrows, anything that is drawn rather than written. You are
   looking at the page and you can see it; whoever reads your answer later
   cannot. This decides whether a "draw and label" question is marked as
   attempted, so do not leave it false when something is drawn.
8. "diagramLabels": every word or short phrase written ON or beside that
   drawing to name a part of it - "stomach", "loop of Henle", "O2 in". Empty
   when there is no drawing.

Return ONLY this JSON:
{"answers":[{"first":12,"last":15,"label":null,"continued":true,"text":"...","hasDiagram":true,"diagramLabels":["stomach","liver"]}]}`;

function unionRegion(boxes: LineBox[], page: AnswerPage): Region {
  const pad = 6;
  const x0 = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y0 = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  const x1 = Math.min(page.width, Math.max(...boxes.map((b) => b.x + b.w)) + pad);
  const y1 = Math.min(page.height, Math.max(...boxes.map((b) => b.y + b.h)) + pad);

  return {
    page: page.index,
    x: x0 / page.width,
    y: y0 / page.height,
    w: (x1 - x0) / page.width,
    h: (y1 - y0) / page.height,
  };
}

function regionsFor(
  first: number,
  last: number,
  lookup: Map<number, { line: LineBox; page: AnswerPage }>
): { regions: Region[]; pages: number[] } {
  const byPage = new Map<number, { boxes: LineBox[]; page: AnswerPage }>();

  for (let i = first; i <= last; i++) {
    const hit = lookup.get(i);
    if (!hit) continue;
    const entry = byPage.get(hit.page.index) ?? { boxes: [], page: hit.page };
    entry.boxes.push(hit.line);
    byPage.set(hit.page.index, entry);
  }

  const pages = [...byPage.keys()].sort((a, b) => a - b);
  return {
    pages,
    regions: pages.map((n) => {
      const entry = byPage.get(n)!;
      return unionRegion(entry.boxes, entry.page);
    }),
  };
}

async function readBatch(batch: AnswerPage[]): Promise<RawAnswerT[]> {
  return cached(
    "answers",
    [PROMPT, batch.map((p) => p.annotatedDataUrl)],
    async () => {
      try {
        const raw = await vision({
          prompt:
            batch.length > 1
              ? `${PROMPT}\n\nYou are given ${batch.length} consecutive pages of the same sheet. Read them as one continuous sheet.`
              : PROMPT,
          images: batch.map((p) => p.annotatedDataUrl),
          maxTokens: batch.length * TOKENS_PER_ANSWER_PAGE_OUT,
        });

        const parsed = RawPayload.safeParse(parseJson(raw));
        if (parsed.success && parsed.data.answers.length > 0) return parsed.data.answers;
      } catch {
      }
      return [];
    }
  );
}

async function readBatchOrPages(batch: AnswerPage[]): Promise<RawAnswerT[]> {
  const answers = await readBatch(batch);
  if (answers.length > 0 || batch.length === 1) return answers;

  const recovered: RawAnswerT[] = [];
  for (const page of batch) recovered.push(...(await readBatch([page])));
  return recovered;
}

export async function extractAnswers(
  pages: AnswerPage[],
  onProgress?: (done: number, total: number) => void
): Promise<AnswerBlock[]> {
  const inked = pages.filter((p) => p.lines.length > 0);

  const lookup = new Map<number, { line: LineBox; page: AnswerPage }>();
  for (const page of pages) {
    for (const line of page.lines) lookup.set(line.index, { line, page });
  }

  const batches: AnswerPage[][] = [];
  for (let i = 0; i < inked.length; i += VISION_MAX_ANSWER_PAGES_PER_REQUEST) {
    batches.push(inked.slice(i, i + VISION_MAX_ANSWER_PAGES_PER_REQUEST));
  }

  const blocks: AnswerBlock[] = [];
  let nextId = 1;
  let pagesDone = 0;

  for (const batch of batches) {
    const answers = [...(await readBatchOrPages(batch))].sort((a, b) => a.first - b.first);
    pagesDone += batch.length;
    onProgress?.(Math.min(pagesDone, pages.length), pages.length);

    for (const [position, answer] of answers.entries()) {
      const first = Math.min(answer.first, answer.last);
      const last = Math.max(answer.first, answer.last);

      const { regions, pages: touched } = regionsFor(first, last, lookup);
      if (regions.length === 0) continue;

      const label = answer.label ? normaliseLabel(answer.label) : null;
      const text = answer.text.trim();
      const previous = blocks[blocks.length - 1];

      const continues =
        position === 0 && !label && (answer.continued ?? true) && Boolean(previous);

      if (continues && previous) {
        previous.text = `${previous.text} ${text}`.trim();
        previous.regions.push(...regions);
        previous.hasDiagram = previous.hasDiagram || answer.hasDiagram;
        for (const l of answer.diagramLabels) {
          if (!previous.diagramLabels.includes(l)) previous.diagramLabels.push(l);
        }
        for (const n of touched) {
          if (!previous.pages.includes(n)) previous.pages.push(n);
        }
      } else {
        blocks.push({
          id: `a${nextId++}`,
          writtenLabel: label,
          text,
          regions,
          pages: touched,
          hasDiagram: answer.hasDiagram,
          diagramLabels: [...answer.diagramLabels],
        });
      }
    }
  }

  const merged: AnswerBlock[] = [];
  for (const block of blocks) {
    const twin = block.writtenLabel
      ? merged.find((b) => b.writtenLabel === block.writtenLabel)
      : undefined;
    if (twin) {
      twin.text = `${twin.text} ${block.text}`.trim();
      twin.regions.push(...block.regions);
      twin.hasDiagram = twin.hasDiagram || block.hasDiagram;
      for (const l of block.diagramLabels) {
        if (!twin.diagramLabels.includes(l)) twin.diagramLabels.push(l);
      }
      for (const p of block.pages) if (!twin.pages.includes(p)) twin.pages.push(p);
    } else {
      merged.push(block);
    }
  }

  return merged.map((b) => ({ ...b, pages: [...b.pages].sort((x, y) => x - y) }));
}
