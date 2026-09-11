import { z } from "zod";

/** What every form action returns to useActionState. */
export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
} | null;

export function fromZodError(error: z.ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, message: "Please fix the highlighted fields.", fieldErrors };
}

export function failure(message: string): ActionState {
  return { ok: false, message };
}

/** Trimmed text field with a friendly message. */
export const text = (label: string, max = 120) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} is too long`);

export const optionalText = (max = 120) => z.string().trim().max(max).optional().default("");
