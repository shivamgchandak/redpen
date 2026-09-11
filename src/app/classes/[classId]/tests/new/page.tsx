import { notFound } from "next/navigation";
import { AppShell } from "@/components/shell";
import { NewTestForm } from "@/components/classroom/NewTestForm";
import { PageBody, PageHeader } from "@/components/ui/Page";
import { getClassroom } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export const metadata = { title: "New test | RedPen" };

export default async function NewTestPage({ params }: { params: Promise<{ classId: string }> }) {
  const teacher = await requireOnboardedTeacher();
  const { classId } = await params;
  const room = await getClassroom(String(teacher._id), classId);
  if (!room) notFound();

  return (
    <AppShell crumb={`${room.name} · New test`} backHref={`/classes/${classId}`} user={shellUser(teacher)}>
      <PageBody className="max-w-[900px]">
        <PageHeader
          title="New test"
          subtitle={`For ${room.name}. Upload the paper and rubric once; every student is marked against them.`}
        />
        <NewTestForm classId={classId} teacherId={String(teacher._id)} />
      </PageBody>
    </AppShell>
  );
}
