"use client";

import { upload } from "@vercel/blob/client";
import { buildPathname, type FileKind } from "./paths";

export interface UploadedFile {
  pathname: string;
  name: string;
  size: number;
  contentType: string;
}

/**
 * Uploads a file (or a rendered page image) from the browser straight to the
 * private Blob store, under the current teacher's folder.
 */
export async function uploadToBlob(
  teacherId: string,
  kind: FileKind,
  file: Blob,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<UploadedFile> {
  const contentType = file.type || "application/octet-stream";
  const pathname = buildPathname(teacherId, kind, fileName, contentType);

  const blob = await upload(pathname, file, {
    access: "private",
    handleUploadUrl: "/api/upload",
    contentType,
    onUploadProgress: onProgress
      ? ({ percentage }) => onProgress(percentage)
      : undefined,
  });

  return {
    pathname: blob.pathname,
    name: fileName,
    size: file.size,
    contentType,
  };
}

/** Turns a canvas data URL from render.ts into a Blob for upload. */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
