import { notFound, redirect } from "next/navigation";
import { ListChecks } from "lucide-react";
import { AppShell } from "@/components/shell";
import { DeleteTestButton } from "@/components/classroom/DeleteTestButton";
import { TestOverview } from "@/components/classroom/TestOverview";
import { ButtonLink } from "@/components/ui/Button";
import { PageBody, PageHeader } from "@/components/ui/Page";
import { paperMaxMarks } from "@/lib/pipeline/grading/choiceGroups";
import { getClassroom, getTest, listStudents, listSubmissionRows } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export default async function TestPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; testId: string }>;
  searchParams: Promise<{ focus?: string }>;
}) {
  const teacher = await requireOnboardedTeacher();
  const teacherId = String(teacher._id);
  const { classId, testId } = await params;
  const { focus } = await searchParams;

  const [room, test] = await Promise.all([getClassroom(teacherId, classId), getTest(teacherId, testId)]);
  if (!room || !test || test.classroomId !== room.id) notFound();
  if (test.status !== "locked") redirect(`/classes/${classId}/tests/${testId}/review`);

  const [students, rows] = await Promise.all([
    listStudents(teacherId, classId),
    listSubmissionRows(teacherId, testId),
  ]);

  return (
    <AppShell crumb={`${room.name} · ${test.title}`} backHref={`/classes/${classId}`} user={shellUser(teacher)}>
      <PageBody>
        <PageHeader
          title={test.title}
          subtitle={`${room.name} · ${test.questions.length} questions · ${paperMaxMarks(test.questions)} marks`}
          actions={
            <>
              <ButtonLink variant="outline" size="sm" href={`/classes/${classId}/tests/${testId}/review`}>
                <ListChecks className="size-4" /> View rubric
              </ButtonLink>
              <DeleteTestButton testId={test.id} title={test.title} />
            </>
          }
        />
        <TestOverview
          classId={classId}
          testId={testId}
          teacherId={teacherId}
          students={students}
          rows={rows}
          maxTotal={paperMaxMarks(test.questions)}
          focusStudentId={focus ?? null}
        />
      </PageBody>
    </AppShell>
  );
}
