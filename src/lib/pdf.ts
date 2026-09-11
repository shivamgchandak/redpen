"use client";

export async function countPages(file: File): Promise<number> {
  if (file.type.startsWith("image/")) return 1;
  if (file.type !== "application/pdf") return 1;

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const pages = doc.numPages;
  doc.cleanup();
  return pages;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb % 1 === 0 ? mb.toFixed(0) : mb.toFixed(1)}MB`;
  return `${Math.round(bytes / 1024)}KB`;
}
