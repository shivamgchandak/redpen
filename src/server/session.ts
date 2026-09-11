import "server-only";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/server/db/connect";
import { User, type UserDoc } from "@/server/db/models";

export type Teacher = UserDoc & { _id: Types.ObjectId };

/** The current teacher's id, or null. Cheap: reads the session cookie only. */
export async function getTeacherId(): Promise<string | null> {
  const session = await auth();
  const id = session?.user?.id;
  return id && Types.ObjectId.isValid(id) ? id : null;
}

/** The current teacher's profile from MongoDB, or null. */
export async function getTeacher(): Promise<Teacher | null> {
  const id = await getTeacherId();
  if (!id) return null;
  await connectDB();
  return User.findById(id).lean<Teacher>();
}

/** For server components and pages: sends guests to sign in. */
export async function requireTeacher(): Promise<Teacher> {
  const teacher = await getTeacher();
  if (!teacher) redirect("/login");
  return teacher;
}

/** Like requireTeacher, and also makes sure the school question asked on the first visit is answered. */
export async function requireOnboardedTeacher(): Promise<Teacher> {
  const teacher = await requireTeacher();
  if (!teacher.school) redirect("/onboarding");
  return teacher;
}

/** What the app shell shows for the current teacher. */
export function shellUser(teacher: Teacher): { name: string; email: string | null } {
  return { name: teacher.name || teacher.email, email: teacher.email };
}

/** For API routes: a 401 response when nobody is signed in. */
export function unauthorized(): Response {
  return Response.json({ error: "Sign in to continue." }, { status: 401 });
}
