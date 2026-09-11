import { connectDB } from "@/server/db/connect";
import { Submission, Test } from "@/server/db/models";

/**
 * Background runs write their progress to MongoDB and the page polls it.
 * Writes are throttled so a fast run does not hammer the database.
 */

const MIN_GAP_MS = 1200;
const lastWrite = new Map<string, number>();

function due(key: string, force: boolean): boolean {
  const now = Date.now();
  if (!force && now - (lastWrite.get(key) ?? 0) < MIN_GAP_MS) return false;
  lastWrite.set(key, now);
  return true;
}

export async function setSubmissionProgress(
  id: string,
  label: string,
  value: number,
  force = false
): Promise<void> {
  if (!due(`s:${id}`, force)) return;
  try {
    await connectDB();
    await Submission.updateOne(
      { _id: id },
      { $set: { progress: { label, value: Math.min(0.99, value), updatedAt: new Date() } } }
    );
  } catch {
    // Progress is a nicety; never fail marking because of it.
  }
}

export async function setTestProgress(
  id: string,
  label: string,
  value: number,
  force = false
): Promise<void> {
  if (!due(`t:${id}`, force)) return;
  try {
    await connectDB();
    await Test.updateOne(
      { _id: id },
      { $set: { progress: { label, value: Math.min(0.99, value), updatedAt: new Date() } } }
    );
  } catch {}
}

/** A run whose progress has not moved for this long is treated as stuck. */
export const STALE_AFTER_MS = 8 * 60 * 1000;
