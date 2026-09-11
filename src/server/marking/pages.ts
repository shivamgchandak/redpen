import { readBlobAsDataUrl } from "@/server/blob";
import type { AnswerPage, LineBox, PageImage } from "@/lib/types";

export async function loadPageImages(
  pages: { index: number; pathname: string; width: number; height: number }[]
): Promise<PageImage[]> {
  return Promise.all(
    pages.map(async (p) => ({
      index: p.index,
      width: p.width,
      height: p.height,
      dataUrl: await readBlobAsDataUrl(p.pathname),
    }))
  );
}

/** Only the images with numbered lines are read by the model; the clean ones are for display. */
export type StoredAnswerPage = {
  index: number;
  annotatedPathname: string;
  width: number;
  height: number;
  lines: unknown;
};

export async function loadAnswerPages(pages: StoredAnswerPage[]): Promise<AnswerPage[]> {
  return Promise.all(
    pages.map(async (p) => ({
      index: p.index,
      width: p.width,
      height: p.height,
      lines: (p.lines ?? []) as LineBox[],
      dataUrl: "",
      annotatedDataUrl: await readBlobAsDataUrl(p.annotatedPathname),
    }))
  );
}
