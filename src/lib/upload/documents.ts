"use client";

import { dataUrlToBlob, uploadToBlob } from "@/lib/blob/client";
import { countPages } from "@/lib/pdf";
import { renderPages, toAnswerPages } from "@/lib/render";
import type { AnswerPageDTO, BlobFileDTO, PageImageDTO } from "@/lib/data/dto";

/**
 * Pages are rendered and (for answer sheets) segmented in the browser, the
 * same as the demo. The server only ever receives finished page images, so
 * it never needs an image library, and big files skip the request body limit
 * by going straight to storage.
 */

type Step = (label: string) => void;

async function uploadOriginal(
  teacherId: string,
  kind: "paper" | "rubric" | "script",
  file: File
): Promise<BlobFileDTO> {
  const [stored, pages] = await Promise.all([
    uploadToBlob(teacherId, kind, file, file.name),
    countPages(file).catch(() => null),
  ]);
  return { ...stored, pages };
}

/** Question paper or rubric: the original file plus one image per page. */
export async function uploadDocument(
  teacherId: string,
  kind: "paper" | "rubric",
  file: File,
  onStep?: Step
): Promise<{ file: BlobFileDTO; pages: PageImageDTO[] }> {
  const what = kind === "paper" ? "question paper" : "rubric";
  onStep?.(`Preparing the ${what}`);
  const rendered = await renderPages(file);

  onStep?.(`Uploading the ${what}`);
  const stored = await uploadOriginal(teacherId, kind, file);

  const pages: PageImageDTO[] = [];
  for (const page of rendered) {
    onStep?.(`Uploading the ${what} (page ${page.index + 1} of ${rendered.length})`);
    const blob = await dataUrlToBlob(page.dataUrl);
    const up = await uploadToBlob(teacherId, "page", blob, `${kind}-page-${page.index + 1}.jpg`);
    pages.push({ index: page.index, pathname: up.pathname, width: page.width, height: page.height });
  }

  return { file: { ...stored, pages: stored.pages ?? rendered.length }, pages };
}

/** Answer sheet: original, clean pages for display, numbered pages for the model. */
export async function uploadAnswerSheet(
  teacherId: string,
  file: File,
  onStep?: Step
): Promise<{ file: BlobFileDTO; pages: AnswerPageDTO[] }> {
  onStep?.("Preparing the answer sheet");
  const rendered = await renderPages(file);

  onStep?.("Finding lines of handwriting");
  const answerPages = await toAnswerPages(rendered);

  onStep?.("Uploading the answer sheet");
  const stored = await uploadOriginal(teacherId, "script", file);

  const pages: AnswerPageDTO[] = [];
  for (const page of answerPages) {
    onStep?.(`Uploading page ${page.index + 1} of ${answerPages.length}`);
    const [clean, numbered] = await Promise.all([
      dataUrlToBlob(page.dataUrl).then((b) =>
        uploadToBlob(teacherId, "page", b, `script-page-${page.index + 1}.jpg`)
      ),
      dataUrlToBlob(page.annotatedDataUrl).then((b) =>
        uploadToBlob(teacherId, "page", b, `script-page-${page.index + 1}-lines.jpg`)
      ),
    ]);
    pages.push({
      index: page.index,
      pathname: clean.pathname,
      annotatedPathname: numbered.pathname,
      width: page.width,
      height: page.height,
      lines: page.lines,
    });
  }

  return { file: { ...stored, pages: stored.pages ?? answerPages.length }, pages };
}

export const ACCEPTED_FILES = "application/pdf,image/png,image/jpeg,image/webp";
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function checkFile(file: File): string | null {
  if (!ACCEPTED_FILES.split(",").includes(file.type)) return "PDF or image files only.";
  if (file.size > MAX_FILE_BYTES) return "That file is over 10MB.";
  return null;
}

/** SHA-256 of the original file's bytes, as hex. Same file, same fingerprint, on any browser. */
export async function fileHash(file: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
