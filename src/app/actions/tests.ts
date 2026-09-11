"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/server/db/connect";
import { Classroom, Submission, Test } from "@/server/db/models";
import { getTeacherId } from "@/server/session";
import { oid } from "@/server/scope";
import { ownsPath } from "@/lib/blob/paths";
import { failure, type ActionState } from "@/lib/actions";
import { CreateTestInput, RubricEditInput } from "@/lib/schemas";

export async function createTest(
  input: CreateTestInput
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const teacherId = await getTeacherId();
  if (!teacherId) return { ok: false, message: "Your session has ended. Please sign in again." };

  const parsed = CreateTestInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Invalid test." };
  }
  const data = parsed.data;

  // Every file must sit in this teacher's own storage folder.
  const paths = [
    data.paper.pathname,
    data.rubricFile?.pathname,
    ...data.paperPages.map((p) => p.pathname),
    ...data.rubricPages.map((p) => p.pathname),
  ].filter((p): p is string => Boolean(p));
  if (!paths.every((p) => ownsPath(teacherId, p))) {
    return { ok: false, message: "Invalid file." };
  }

  const classroomId = oid(data.classroomId);
  if (!classroomId) return { ok: false, message: "Class not found." };

  await connectDB();
  const room = await Classroom.exists({ _id: classroomId, ownerId: teacherId, archivedAt: null });
  if (!room) return { ok: false, message: "Class not found." };

  const test = await Test.create({
    classroomId,
    ownerId: teacherId,
    title: data.title,
    status: "draft",
    paper: data.paper,
    rubricFile: data.rubricFile,
    paperPages: data.paperPages,
    rubricPages: data.rubricPages,
  });

  revalidatePath(`/classes/${classroomId}`);
  return { ok: true, id: String(test._id) };
}

/** Saves the teacher's edits to marks and rubric points while the test is in review. */
export async function saveRubric(input: RubricEditInput): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const parsed = RubricEditInput.safeParse(input);
  if (!parsed.success) return failure("Every question needs marks, and every point needs text.");

  const id = oid(parsed.data.testId);
  if (!id) return failure("Test not found.");

  await connectDB();
  const test = await Test.findOne({ _id: id, ownerId: teacherId });
  if (!test) return failure("Test not found.");
  if (test.status !== "review") return failure("This test is locked. Unlock it to make changes.");

  const edits = new Map(parsed.data.questions.map((q) => [q.number, q]));

  test.questions.forEach((q) => {
    const edit = edits.get(q.number);
    if (edit) q.maxMarks = edit.maxMarks;
  });

  const byNumber = new Map(test.rubric.map((r) => [r.questionNumber, r]));
  const nextRubric = test.questions.map((q) => {
    const edit = edits.get(q.number);
    const current = byNumber.get(q.number);
    const scheme = (current?.scheme ?? {}) as Record<string, unknown>;
    if (!edit) return current ?? null;

    type Point = { text: string; kind?: string; marks?: number | null; essential?: boolean };
    const oldPoints = (scheme.points as Point[]) ?? [];
    const kindByText = new Map(oldPoints.map((p) => [p.text, p.kind ?? "content"]));
    const signature = (list: Point[]) =>
      JSON.stringify(list.map((p) => [p.text, p.marks ?? null, Boolean(p.essential)]));
    const before = signature(oldPoints);
    // Keep each point's kind (label, working, ...) when its text is unchanged.
    const points = edit.points.map((p) => ({
      text: p.text,
      kind: kindByText.get(p.text) ?? "content",
      essential: p.essential,
      marks: p.marks,
    }));
    const changed = before !== signature(points) || !current;

    return {
      questionNumber: q.number,
      source: current?.source ?? "teacher",
      editedByTeacher: Boolean(current?.editedByTeacher) || changed,
      scheme: {
        answerType: scheme.answerType ?? "explain",
        requiresDiagram: scheme.requiresDiagram ?? false,
        diagramLabels: scheme.diagramLabels ?? [],
        ...scheme,
        questionNumber: q.number,
        points,
      },
    };
  });

  test.set("rubric", nextRubric.filter(Boolean));
  test.markModified("questions");
  await test.save();

  revalidatePath(`/classes/${test.classroomId}/tests/${test._id}`, "layout");
  return { ok: true, message: "Saved." };
}

export async function lockTest(testId: string): Promise<ActionState> {
  const teacherId = await getTeacherId();
  const id = oid(testId);
  if (!teacherId || !id) return failure("Test not found.");

  await connectDB();
  const test = await Test.findOne({ _id: id, ownerId: teacherId });
  if (!test) return failure("Test not found.");
  if (test.status !== "review") return failure("Only a test in review can be locked.");

  const missingMarks = test.questions.filter((q) => !q.maxMarks).map((q) => q.display);
  if (missingMarks.length) {
    return failure(`Set the marks for question ${missingMarks.join(", ")} first.`);
  }
  const withRubric = new Set(
    test.rubric
      .filter((r) => ((r.scheme as { points?: unknown[] })?.points ?? []).length > 0)
      .map((r) => r.questionNumber)
  );
  const missingRubric = test.questions.filter((q) => !withRubric.has(q.number)).map((q) => q.display);
  if (missingRubric.length) {
    return failure(`Add at least one rubric point for question ${missingRubric.join(", ")}.`);
  }

  test.status = "locked";
  test.lockedAt = new Date();
  await test.save();

  revalidatePath(`/classes/${test.classroomId}`, "layout");
  redirect(`/classes/${test.classroomId}/tests/${test._id}`);
}

/** Only allowed before any script is marked, so no two students see different rubrics. */
export async function unlockTest(testId: string): Promise<ActionState> {
  const teacherId = await getTeacherId();
  const id = oid(testId);
  if (!teacherId || !id) return failure("Test not found.");

  await connectDB();
  const test = await Test.findOne({ _id: id, ownerId: teacherId });
  if (!test) return failure("Test not found.");

  const marked = await Submission.exists({ testId: id, status: { $in: ["done", "needs_review"] } });
  if (marked) {
    return failure("Scripts have already been marked with this rubric, so it stays locked.");
  }

  test.status = "review";
  test.lockedAt = null;
  await test.save();

  revalidatePath(`/classes/${test.classroomId}`, "layout");
  redirect(`/classes/${test.classroomId}/tests/${test._id}/review`);
}

export async function deleteTest(testId: string): Promise<void> {
  const teacherId = await getTeacherId();
  const id = oid(testId);
  if (!teacherId || !id) return;

  await connectDB();
  const test = await Test.findOneAndDelete({ _id: id, ownerId: teacherId });
  if (!test) return;
  await Submission.deleteMany({ testId: id, ownerId: teacherId });

  revalidatePath(`/classes/${test.classroomId}`);
  redirect(`/classes/${test.classroomId}`);
}
