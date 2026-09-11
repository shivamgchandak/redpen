"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/server/db/connect";
import { Classroom, Student, Submission } from "@/server/db/models";
import { getTeacherId } from "@/server/session";
import { oid } from "@/server/scope";
import { failure, type ActionState } from "@/lib/actions";
import { parseRoster } from "@/lib/roster";

const MAX_STUDENTS_PER_CLASS = 120;

export async function addStudents(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const classroomId = oid(String(formData.get("classroomId") ?? ""));
  if (!classroomId) return failure("Class not found.");

  const roster = parseRoster(String(formData.get("roster") ?? ""));
  if (roster.length === 0) return failure("Type at least one student name.");

  await connectDB();
  const room = await Classroom.exists({ _id: classroomId, ownerId: teacherId });
  if (!room) return failure("Class not found.");

  const existing = await Student.find({ classroomId }).select({ rollNo: 1, name: 1 }).lean();
  if (existing.length + roster.length > MAX_STUDENTS_PER_CLASS) {
    return failure(`A class can hold up to ${MAX_STUDENTS_PER_CLASS} students.`);
  }

  const takenRolls = new Set(existing.map((s) => s.rollNo).filter(Boolean));
  const fresh: { name: string; rollNo: string }[] = [];
  const skipped: string[] = [];
  for (const s of roster) {
    if (s.rollNo && takenRolls.has(s.rollNo)) {
      skipped.push(s.rollNo);
      continue;
    }
    if (s.rollNo) takenRolls.add(s.rollNo);
    fresh.push(s);
  }

  if (fresh.length > 0) {
    await Student.insertMany(
      fresh.map((s) => ({ ...s, classroomId, ownerId: teacherId })),
      { ordered: false }
    );
  }

  revalidatePath(`/classes/${classroomId}`);
  const added = `Added ${fresh.length} student${fresh.length === 1 ? "" : "s"}.`;
  return {
    ok: true,
    message: skipped.length
      ? `${added} Skipped roll number ${skipped.join(", ")} because it is already in the class.`
      : added,
  };
}

const RenameInput = z.object({
  studentId: z.string(),
  name: z.string().trim().min(1).max(80),
  rollNo: z.string().trim().max(12).default(""),
});

export async function updateStudent(input: z.infer<typeof RenameInput>): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");
  const parsed = RenameInput.safeParse(input);
  if (!parsed.success) return failure("Name is required.");

  const id = oid(parsed.data.studentId);
  if (!id) return failure("Student not found.");

  await connectDB();
  const student = await Student.findOne({ _id: id, ownerId: teacherId });
  if (!student) return failure("Student not found.");

  if (parsed.data.rollNo) {
    const clash = await Student.exists({
      classroomId: student.classroomId,
      rollNo: parsed.data.rollNo,
      _id: { $ne: id },
    });
    if (clash) return failure(`Roll number ${parsed.data.rollNo} is already taken.`);
  }

  student.name = parsed.data.name;
  student.rollNo = parsed.data.rollNo;
  await student.save();
  revalidatePath(`/classes/${student.classroomId}`);
  return { ok: true };
}

/** Removing a student also removes their marked answer sheets. */
export async function removeStudent(studentId: string): Promise<ActionState> {
  const teacherId = await getTeacherId();
  const id = oid(studentId);
  if (!teacherId || !id) return failure("Student not found.");

  await connectDB();
  const student = await Student.findOneAndDelete({ _id: id, ownerId: teacherId });
  if (!student) return failure("Student not found.");
  await Submission.deleteMany({ studentId: id, ownerId: teacherId });

  revalidatePath(`/classes/${student.classroomId}`);
  return { ok: true };
}
