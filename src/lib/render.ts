"use client";

import type { AnswerPage, LineBox, PageImage } from "./types";

const TARGET_WIDTH = 900;
const JPEG_QUALITY = 0.72;

export async function renderPages(file: File): Promise<PageImage[]> {
  if (file.type.startsWith("image/")) return [await renderImageFile(file)];
  return renderPdf(file);
}

async function renderImageFile(file: File): Promise<PageImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, TARGET_WIDTH / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return {
    index: 0,
    dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
    width: canvas.width,
    height: canvas.height,
  };
}

async function renderPdf(file: File): Promise<PageImage[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: PageImage[] = [];

  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width });

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    pages.push({
      index: n - 1,
      dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY),
      width: canvas.width,
      height: canvas.height,
    });
  }

  doc.cleanup();
  return pages;
}

const INK_LUMA = 150;
const MIN_ROW_DENSITY = 0.004;
const MAX_GAP_ROWS = 4;
const MIN_LINE_HEIGHT = 6;

export async function segmentLines(page: PageImage): Promise<LineBox[]> {
  const bitmap = await createImageBitmap(await dataUrlToBlob(page.dataUrl));
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);

  const dark = new Uint8Array(width * height);
  const rowCount = new Int32Array(height);

  for (let y = 0; y < height; y++) {
    let count = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (luma < INK_LUMA) {
        dark[y * width + x] = 1;
        count++;
      }
    }
    rowCount[y] = count;
  }

  const threshold = Math.max(2, Math.round(width * MIN_ROW_DENSITY));
  const bands: { top: number; bottom: number }[] = [];
  let top = -1;
  let gap = 0;

  for (let y = 0; y < height; y++) {
    const inked = rowCount[y] >= threshold;
    if (inked) {
      if (top === -1) top = y;
      gap = 0;
    } else if (top !== -1) {
      gap++;
      if (gap > MAX_GAP_ROWS) {
        bands.push({ top, bottom: y - gap });
        top = -1;
        gap = 0;
      }
    }
  }
  if (top !== -1) bands.push({ top, bottom: height - 1 });

  const lines: LineBox[] = [];
  for (const band of bands) {
    if (band.bottom - band.top + 1 < MIN_LINE_HEIGHT) continue;

    let left = width;
    let right = -1;
    for (let y = band.top; y <= band.bottom; y++) {
      const row = y * width;
      for (let x = 0; x < left; x++) if (dark[row + x]) { left = x; break; }
      for (let x = width - 1; x > right; x--) if (dark[row + x]) { right = x; break; }
    }
    if (right <= left) continue;

    lines.push({
      index: lines.length,
      x: left,
      y: band.top,
      w: right - left + 1,
      h: band.bottom - band.top + 1,
    });
  }

  return lines;
}

const GUTTER = 48;

export async function annotateLines(
  page: PageImage,
  lines: LineBox[]
): Promise<string> {
  const bitmap = await createImageBitmap(await dataUrlToBlob(page.dataUrl));
  const canvas = document.createElement("canvas");
  canvas.width = page.width + GUTTER;
  canvas.height = page.height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, GUTTER, 0);
  bitmap.close();

  ctx.fillStyle = "#dd1111";
  ctx.font = "bold 13px monospace";
  ctx.textBaseline = "alphabetic";
  for (const line of lines) {
    ctx.fillText(`[${line.index}]`, 3, Math.min(page.height - 2, line.y + line.h));
  }

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function toAnswerPages(pages: PageImage[]): Promise<AnswerPage[]> {
  const out: AnswerPage[] = [];
  let nextIndex = 0;

  for (const page of pages) {
    const lines = (await segmentLines(page)).map((line) => ({
      ...line,
      index: nextIndex++,
    }));
    out.push({ ...page, lines, annotatedDataUrl: await annotateLines(page, lines) });
  }

  return out;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
