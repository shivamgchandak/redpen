/**
 * Every file lives under its teacher's folder in the private Blob store:
 *
 *   teachers/<teacherId>/<kind>/<name>-<random suffix>.<ext>
 *
 * The upload route only issues tokens for the caller's own folder and the
 * file route only serves from it, so ownership is checked from the path
 * alone, without a database lookup.
 */

export const FILE_KINDS = ["paper", "rubric", "script", "page"] as const;
export type FileKind = (typeof FILE_KINDS)[number];

export const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export function teacherFolder(teacherId: string): string {
  return `teachers/${teacherId}/`;
}

export function ownsPath(teacherId: string, pathname: string): boolean {
  return (
    pathname.startsWith(teacherFolder(teacherId)) &&
    !pathname.includes("..") &&
    !pathname.includes("//")
  );
}

function safeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return cleaned || "file";
}

function extensionFor(name: string, contentType: string): string {
  const fromName = name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName) return fromName;
  if (contentType === "application/pdf") return "pdf";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export function buildPathname(
  teacherId: string,
  kind: FileKind,
  fileName: string,
  contentType: string
): string {
  return `${teacherFolder(teacherId)}${kind}/${safeName(fileName)}.${extensionFor(fileName, contentType)}`;
}

/** URL the browser uses to show a private file. */
export function fileUrl(pathname: string): string {
  return `/api/files?pathname=${encodeURIComponent(pathname)}`;
}
