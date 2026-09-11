import { Types } from "mongoose";

/** Parses an id from a URL or form. Invalid ids behave like "not found". */
export function oid(value: string | null | undefined): Types.ObjectId | null {
  return value && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
}

export function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

export function isoOrNull(value: unknown): string | null {
  return value ? iso(value) : null;
}

/** Roll numbers sort naturally ("2" before "10"), students without one go last by name. */
export function compareStudents(
  a: { name: string; rollNo: string },
  b: { name: string; rollNo: string }
): number {
  if (a.rollNo && !b.rollNo) return -1;
  if (!a.rollNo && b.rollNo) return 1;
  const byRoll = a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
  return byRoll !== 0 ? byRoll : a.name.localeCompare(b.name);
}
