import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { TeacherResult } from "@/components/classroom/TeacherResult";
import { fileUrl } from "@/lib/blob/paths";
import { effectiveTotal, withOverrides } from "@/lib/data/grades";
import { getClassroom, getSubmission, getTest, listStudents, listSubmissionRows } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";
import type { AnalysisResult, SheetPage } from "@/lib/types";

export default async function StudentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; testId: string; studentId: string }>;
  searchParams: Promise<{ kept?: string }>;
}) {
  const { kept } = await searchParams;
  const teacher = await requireOnboardedTeacher();
  const teacherId = String(teacher._id);
  const { classId, testId, studentId } = await params;
  const testHref = `/classes/${classId}/tests/${testId}`;

  const [room, test, submission, students] = await Promise.all([
    getClassroom(teacherId, classId),
    getTest(teacherId, testId),
    getSubmission(teacherId, testId, studentId),
    listStudents(teacherId, classId),
  ]);
  if (!room || !test || test.classroomId !== room.id) notFound();

  const student = students.find((s) => s.id === studentId);
  if (!student) notFound();
  if (!submission || !(submission.status === "done" || submission.status === "needs_review")) {
    redirect(`${testHref}?focus=${studentId}`);
  }

  // Next student: the next one in roll order who is not marked yet, else simply the next one.
  const rows = await listSubmissionRows(teacherId, testId);
  const markedIds = new Set(rows.filter((r) => r.status === "done" || r.status === "needs_review").map((r) => r.studentId));
  const here = students.findIndex((s) => s.id === studentId);
  const after = [...students.slice(here + 1), ...students.slice(0, here)];
  const nextUnmarked = after.find((s) => !markedIds.has(s.id));
  const nextAny = students[here + 1];
  const next = nextUnmarked ?? nextAny ?? null;
  const nextHref = next
    ? markedIds.has(next.id)
      ? `${testHref}/students/${next.id}`
      : `${testHref}?focus=${next.id}`
    : null;
  const nextLabel = next ? (markedIds.has(next.id) ? `Next: ${next.name}` : `Mark ${next.name}`) : null;

  const grades = withOverrides(submission.grades);
  const score = effectiveTotal(submission.grades);
  const summary = submission.summary ?? {
    questionCount: test.questions.length,
    attempted: 0,
    unattempted: 0,
    unmatchedAnswers: 0,
    score,
    maxScore: submission.maxTotal ?? 0,
    overallFeedback: "",
  };

  const result: AnalysisResult = {
    jobId: submission.id,
    questions: test.questions,
    answers: submission.answers,
    mappings: submission.mappings,
    grades,
    summary: { ...summary, score },
    answerPageSizes: submission.pages.map((p) => ({ width: p.width, height: p.height })),
    elapsedMs: submission.elapsedMs ?? 0,
    warnings: submission.warnings,
  };

  const pages: SheetPage[] = submission.pages.map((p) => ({
    dataUrl: fileUrl(p.pathname),
    width: p.width,
    height: p.height,
  }));

  const original = Object.fromEntries(submission.grades.map((g) => [g.questionNumber, g.score]));
  const overrides = Object.fromEntries(submission.grades.map((g) => [g.questionNumber, g.overrideScore]));

  return (
    <AppShell crumb={`${test.title} · ${student.name}`} backHref={testHref} collapsedSidebar user={shellUser(teacher)}>
      <TeacherResult
        result={result}
        pages={pages}
        submissionId={submission.id}
        studentName={student.name}
        rollNo={student.rollNo}
        original={original}
        overrides={overrides}
        backHref={testHref}
        nextHref={nextHref}
        nextLabel={nextLabel}
        notice={kept ? "Same file as before, so the existing marks were kept. Nothing was marked again." : null}
      />
    </AppShell>
  );
}
