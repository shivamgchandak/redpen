"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/server/db/connect";
import { Student, Submission, Test } from "@/server/db/models";
import { getTeacherId } from "@/server/session";
import { oid } from "@/server/scope";
import { ownsPath } from "@/lib/blob/paths";
import { effectiveTotal } from "@/lib/data/grades";
import type { StoredGrade } from "@/lib/data/dto";
import { failure, type ActionState } from "@/lib/actions";
import { AnswerSheetInput, OverrideInput, SameSheetInput } from "@/lib/schemas";

/**
 * Is this exact file already marked for this student on this test? The
 * rubric is locked, so marking it again could only produce drift, never a
 * better answer. The caller skips upload and marking and keeps the marks.
 */
export async function findSameSheet(
  input: z.infer<typeof SameSheetInput>
): Promise<{ same: boolean }> {
  const teacherId = await getTeacherId();
  const parsed = SameSheetInput.safeParse(input);
  if (!teacherId || !parsed.success) return { same: false };

  const testId = oid(parsed.data.testId);
  const studentId = oid(parsed.data.studentId);
  if (!testId || !studentId) return { same: false };

  await connectDB();
  const existing = await Submission.exists({
    testId,
    studentId,
    ownerId: teacherId,
    sourceHash: parsed.data.sourceHash,
    status: { $in: ["done", "needs_review"] },
  });
  return { same: Boolean(existing) };
}

/** Stores (or replaces) a student's answer sheet, ready to be marked. */
export async function saveAnswerSheet(
  input: AnswerSheetInput
): Promise<{ ok: true; id: string; kept: boolean } | { ok: false; message: string }> {
  const teacherId = await getTeacherId();
  if (!teacherId) return { ok: false, message: "Your session has ended. Please sign in again." };

  const parsed = AnswerSheetInput.safeParse(input);
  if (!parsed.success) return { ok: false, message: "The answer sheet could not be read." };
  const data = parsed.data;

  const paths = [
    data.sourceFile.pathname,
    ...data.pages.flatMap((p) => [p.pathname, p.annotatedPathname]),
  ];
  if (!paths.every((p) => ownsPath(teacherId, p))) return { ok: false, message: "Invalid file." };

  const testId = oid(data.testId);
  const studentId = oid(data.studentId);
  if (!testId || !studentId) return { ok: false, message: "Not found." };

  await connectDB();
  const test = await Test.findOne({ _id: testId, ownerId: teacherId }).select({ classroomId: 1, status: 1 });
  if (!test) return { ok: false, message: "Test not found." };
  if (test.status !== "locked") return { ok: false, message: "Lock the rubric before marking scripts." };

  const student = await Student.exists({ _id: studentId, classroomId: test.classroomId, ownerId: teacherId });
  if (!student) return { ok: false, message: "Student not found in this class." };

  // Second guard, in case the same file arrives without the earlier check.
  const same = await Submission.findOne({
    testId,
    studentId,
    ownerId: teacherId,
    sourceHash: data.sourceHash,
    status: { $in: ["done", "needs_review"] },
  }).select({ _id: 1 });
  if (same) return { ok: true, id: String(same._id), kept: true };

  const doc = await Submission.findOneAndUpdate(
    { testId, studentId },
    {
      $set: {
        classroomId: test.classroomId,
        ownerId: teacherId,
        status: "uploaded",
        sourceFile: data.sourceFile,
        sourceHash: data.sourceHash,
        pages: data.pages,
        answers: [],
        mappings: [],
        grades: [],
        summary: null,
        total: null,
        maxTotal: null,
        warnings: [],
        error: null,
        elapsedMs: null,
        markedAt: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  if (!doc) return { ok: false, message: "Could not save the answer sheet." };

  return { ok: true, id: String(doc._id), kept: false };
}

/** The teacher's mark replaces the automatic one; null puts the automatic mark back. */
export async function overrideMark(input: OverrideInput): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const parsed = OverrideInput.safeParse(input);
  if (!parsed.success) return failure("Enter a mark between 0 and the question's maximum.");
  const { questionNumber, score, note } = parsed.data;

  const id = oid(parsed.data.submissionId);
  if (!id) return failure("Answer sheet not found.");

  await connectDB();
  const sub = await Submission.findOne({ _id: id, ownerId: teacherId });
  if (!sub) return failure("Answer sheet not found.");

  const grade = sub.grades.find((g) => g.questionNumber === questionNumber);
  if (!grade) return failure("Question not found.");
  if (score !== null && grade.maxMarks !== null && grade.maxMarks !== undefined && score > grade.maxMarks) {
    return failure(`The most this question can score is ${grade.maxMarks}.`);
  }
  if (score !== null && Math.round(score * 2) !== score * 2) {
    return failure("Marks go in steps of 0.5.");
  }

  grade.overrideScore = score;
  grade.overrideNote = score === null ? null : note || null;

  const grades = JSON.parse(JSON.stringify(sub.grades)) as StoredGrade[];
  sub.total = effectiveTotal(grades);
  const stillToReview = grades.some((g) => g.needsReview && g.overrideScore === null);
  sub.status = stillToReview ? "needs_review" : "done";
  await sub.save();

  revalidatePath(`/classes/${sub.classroomId}/tests/${sub.testId}`, "layout");
  return { ok: true, message: "Mark saved." };
}
