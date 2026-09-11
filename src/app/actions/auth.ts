"use server";

import { signIn, signOut } from "@/auth";

/** Only same-site paths, so the login form can't bounce anyone elsewhere. */
function safeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/classes";
  if (!value.startsWith("/") || value.startsWith("//")) return "/classes";
  return value;
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  await signIn("google", { redirectTo: safeReturnPath(formData.get("redirectTo")) });
}

export async function signOutToHome(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
