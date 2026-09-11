import { start } from "workflow/api";
import { connectDB } from "@/server/db/connect";
import { Submission, Test } from "@/server/db/models";
import { oid } from "@/server/scope";
import { STALE_AFTER_MS } from "./progress";
import { markSubmissionWorkflow } from "@/workflows/markSubmission";
import { readTestWorkflow } from "@/workflows/readTest";

export type StartResult = { ok: true; alreadyRunning?: boolean } | { ok: false; status: number; error: string };

function isRecent(progress: { updatedAt?: Date | string | null } | null | undefined): boolean {
  const at = progress?.updatedAt ? new Date(progress.updatedAt).getTime() : 0;
  return Date.now() - at < STALE_AFTER_MS;
}

function runIdOf(run: unknown): string | null {
  const id = (run as { runId?: unknown } | null)?.runId;
  return typeof id === "string" ? id : null;
}

function noKey(): StartResult | null {
  return process.env.GROQ_API_KEY
    ? null
    : { ok: false, status: 500, error: "GROQ_API_KEY is not configured." };
}

/** Starts reading a test's paper and rubric in the background. Safe to call twice. */
export async function startTestRead(teacherId: string, testId: string): Promise<StartResult> {
  const id = oid(testId);
  if (!id) return { ok: false, status: 404, error: "Test not found." };
  const missing = noKey();
  if (missing) return missing;

  await connectDB();
  const test = await Test.findOne({ _id: id, ownerId: teacherId });
  if (!test) return { ok: false, status: 404, error: "Test not found." };
  if (test.status === "locked" || test.status === "review") {
    return { ok: false, status: 409, error: "This test has already been read." };
  }
  if (test.status === "reading" && isRecent(test.progress)) return { ok: true, alreadyRunning: true };

  test.set({
    status: "reading",
    error: null,
    progress: { label: "Queued", value: 0.02, updatedAt: new Date() },
  });
  await test.save();

  const run = await start(readTestWorkflow, [String(id)]);
  await Test.updateOne({ _id: id }, { $set: { runId: runIdOf(run) } });
  return { ok: true };
}

/** Starts marking one answer sheet in the background. Safe to call twice. */
export async function startMarking(teacherId: string, submissionId: string): Promise<StartResult> {
  const id = oid(submissionId);
  if (!id) return { ok: false, status: 404, error: "Answer sheet not found." };
  const missing = noKey();
  if (missing) return missing;

  await connectDB();
  const sub = await Submission.findOne({ _id: id, ownerId: teacherId });
  if (!sub) return { ok: false, status: 404, error: "Answer sheet not found." };

  const test = await Test.findOne({ _id: sub.testId, ownerId: teacherId }).select({ status: 1 }).lean();
  if (!test) return { ok: false, status: 404, error: "Test not found." };
  if (test.status !== "locked") return { ok: false, status: 409, error: "Lock the rubric before marking scripts." };

  const running = ["queued", "reading", "mapping", "grading"].includes(sub.status);
  if (running && isRecent(sub.progress)) return { ok: true, alreadyRunning: true };
  if (sub.status === "done" || sub.status === "needs_review") {
    return { ok: false, status: 409, error: "This answer sheet is already marked. Upload a different file to mark it again." };
  }

  sub.set({
    status: "queued",
    error: null,
    queuedAt: new Date(),
    progress: { label: "Queued", value: 0.02, updatedAt: new Date() },
  });
  await sub.save();

  const run = await start(markSubmissionWorkflow, [String(id)]);
  await Submission.updateOne({ _id: id }, { $set: { runId: runIdOf(run) } });
  return { ok: true };
}
