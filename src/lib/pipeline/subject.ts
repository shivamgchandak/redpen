/**
 * The subject comes back with the question paper call (no extra model call).
 * This only decides whether it is different enough from the class to warn.
 */
/** Loose match: "Bio" vs "Biology", "Maths" vs "Mathematics", "Science" covers the sciences. */
export function subjectsDiffer(classSubject: string, detected: string | null): boolean {
  if (!detected) return false;
  const a = classSubject.trim().toLowerCase();
  const b = detected.trim().toLowerCase();
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return false;
  if (a.slice(0, 4) === b.slice(0, 4)) return false;
  const sciences = ["biology", "physics", "chemistry", "science", "evs", "environmental"];
  if (sciences.some((s) => a.includes(s)) && sciences.some((s) => b.includes(s))) return false;
  return true;
}
