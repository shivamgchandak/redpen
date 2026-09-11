import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { ReadTestPanel } from "@/components/classroom/ReadTestPanel";
import { RubricEditor } from "@/components/classroom/RubricEditor";
import { DeleteTestButton } from "@/components/classroom/DeleteTestButton";
import { PageBody, PageHeader } from "@/components/ui/Page";
import { getClassroom, getTest, listSubmissionRows } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export const metadata = { title: "Rubric | RedPen" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ classId: string; testId: string }>;
}) {
  const teacher = await requireOnboardedTeacher();
  const teacherId = String(teacher._id);
  const { classId, testId } = await params;

  const [room, test] = await Promise.all([getClassroom(teacherId, classId), getTest(teacherId, testId)]);
  if (!room || !test || test.classroomId !== room.id) notFound();

  const rows = test.status === "locked" ? await listSubmissionRows(teacherId, testId) : [];
  const canUnlock = !rows.some((r) => r.status === "done" || r.status === "needs_review");
  const needsReading = test.status === "draft" || test.status === "reading" || test.status === "failed";

  return (
    <AppShell crumb={`${room.name} · ${test.title}`} backHref={`/classes/${classId}`} user={shellUser(teacher)}>
      <PageBody className="max-w-[960px]">
        <PageHeader
          title={test.title}
          subtitle={needsReading ? "Reading the question paper and rubric" : "Questions and rubric"}
          actions={<DeleteTestButton testId={test.id} title={test.title} />}
        />
        {needsReading ? (
          <ReadTestPanel
            testId={test.id}
            status={test.status as "draft" | "reading" | "failed"}
            error={test.error}
            progress={test.progress}
          />
        ) : (
          <RubricEditor test={test} classId={classId} canUnlock={canUnlock} />
        )}
      </PageBody>
    </AppShell>
  );
}
