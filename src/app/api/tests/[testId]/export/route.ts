import { getTeacherId, unauthorized } from "@/server/session";
import { getClassroom, getTest, listStudents } from "@/server/queries";
import { connectDB } from "@/server/db/connect";
import { Submission } from "@/server/db/models";
import { oid } from "@/server/scope";
import { effectiveScore } from "@/lib/data/grades";
import type { StoredGrade } from "@/lib/data/dto";

export const dynamic = "force-dynamic";

function cell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Marksheet for the whole class: one row per student, one column per question. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ testId: string }> }
): Promise<Response> {
  const teacherId = await getTeacherId();
  if (!teacherId) return unauthorized();

  const { testId } = await params;
  const test = await getTest(teacherId, testId);
  if (!test) return new Response("Not found", { status: 404 });
  const room = await getClassroom(teacherId, test.classroomId);
  if (!room) return new Response("Not found", { status: 404 });

  const students = await listStudents(teacherId, test.classroomId);
  await connectDB();
  const subs = await Submission.find({ testId: oid(testId), ownerId: oid(teacherId) })
    .select({ studentId: 1, status: 1, grades: 1, total: 1, maxTotal: 1 })
    .lean();
  const byStudent = new Map(subs.map((s) => [String(s.studentId), s]));

  const header = [
    "Roll number",
    "Name",
    ...test.questions.map((q) => `Question ${q.display} (${q.maxMarks ?? ""} marks)`),
    "Total",
    "Out of",
    "Status",
  ];

  const rows = students.map((st) => {
    const sub = byStudent.get(st.id);
    const grades = new Map(
      ((sub?.grades ?? []) as unknown as StoredGrade[]).map((g) => [g.questionNumber, g])
    );
    const marked = sub && (sub.status === "done" || sub.status === "needs_review");
    return [
      st.rollNo,
      st.name,
      ...test.questions.map((q) => {
        const g = grades.get(q.number);
        if (!marked || !g) return "";
        return g.counted ? effectiveScore(g) : `(${effectiveScore(g)})`;
      }),
      marked ? sub?.total ?? "" : "",
      marked ? sub?.maxTotal ?? "" : "",
      !sub ? "No sheet" : sub.status === "needs_review" ? "Needs review" : sub.status === "done" ? "Marked" : sub.status,
    ];
  });

  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  const filename = `${room.name} ${test.title}.csv`.replace(/[^\w .-]+/g, "_");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
