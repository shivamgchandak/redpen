"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { connectDB } from "@/server/db/connect";
import { User } from "@/server/db/models";
import { getTeacherId } from "@/server/session";
import { failure, fromZodError, text, type ActionState } from "@/lib/actions";

const ProfileInput = z.object({
  name: text("Your name", 80),
  school: text("School name", 120),
  next: z.enum(["classes", "stay"]).default("stay"),
});

export async function saveProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const teacherId = await getTeacherId();
  if (!teacherId) return failure("Your session has ended. Please sign in again.");

  const parsed = ProfileInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  await connectDB();
  await User.updateOne(
    { _id: teacherId },
    { $set: { name: parsed.data.name, school: parsed.data.school } }
  );

  revalidatePath("/", "layout");
  if (parsed.data.next === "classes") redirect("/classes");
  return { ok: true, message: "Saved." };
}
