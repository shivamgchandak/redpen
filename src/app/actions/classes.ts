"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/server/db/connect";
import { Classroom } from "@/server/db/models";
import { getTeacherId } from "@/server/session";
import { oid } from "@/server/scope";
import { failure, fromZodError, optionalText, text, type ActionState } from "@/lib/actions";

const ClassInput = z.object({
  school: text("School", 120),
  grade: text("Class", 20),
  section: optionalText(20),
  subject: text("Subject", 60),
  name: optionalText(80),
});

/** "10", "B", "Biology" gives "10B Biology" */
export async function defaultClassName(grade: string, section: string, subject: string) {
  return `${grade}${section ?? ""} ${subject}`.trim();
}

export async function createClassroom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const parsed = ClassInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { school, grade, section, subject } = parsed.data;
  const name = parsed.data.name || (await defaultClassName(grade, section, subject));

  await connectDB();
  const room = await Classroom.create({ ownerId: teacherId, name, school, grade, section, subject });

  revalidatePath("/classes");
  redirect(`/classes/${room._id}`);
}

export async function updateClassroom(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const id = oid(String(formData.get("classroomId") ?? ""));
  if (!id) return failure("Class not found.");

  const parsed = ClassInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const { school, grade, section, subject } = parsed.data;
  const name = parsed.data.name || (await defaultClassName(grade, section, subject));

  await connectDB();
  const res = await Classroom.updateOne(
    { _id: id, ownerId: teacherId },
    { $set: { name, school, grade, section, subject } }
  );
  if (res.matchedCount === 0) return failure("Class not found.");

  revalidatePath(`/classes/${id}`);
  revalidatePath("/classes");
  return { ok: true, message: "Class updated." };
}

/** Archived classes disappear from the list but keep their tests and marks. */
export async function archiveClassroom(classroomId: string): Promise<void> {
  const teacherId = await getTeacherId();
  const id = oid(classroomId);
  if (!teacherId || !id) return;

  await connectDB();
  await Classroom.updateOne({ _id: id, ownerId: teacherId }, { $set: { archivedAt: new Date() } });
  revalidatePath("/classes");
  redirect("/classes");
}
