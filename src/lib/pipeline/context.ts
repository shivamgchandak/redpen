/**
 * Who the paper is for. Feeds every prompt so a Class 8 History test is not
 * marked like a Class 10 Biology one. Comes from the class the teacher set up.
 */
export interface ExamContext {
  subject: string;
  grade: string;
}

/** The bundled demo paper is a Class X Biology paper. */
export const DEMO_CONTEXT: ExamContext = { subject: "Biology", grade: "X" };

/** "Class X biology". A lowercase subject keeps the demo's cached prompts unchanged. */
export function levelOf(ctx: ExamContext): string {
  const grade = ctx.grade.trim();
  const subject = subjectOf(ctx);
  return grade ? `Class ${grade} ${subject}` : subject;
}

export function subjectOf(ctx: ExamContext): string {
  return ctx.subject.trim().toLowerCase() || "school";
}
