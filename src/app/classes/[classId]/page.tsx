import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/shell";
import { ClassActions } from "@/components/classroom/ClassActions";
import { accentFor } from "@/components/classroom/ClassCard";
import { ClassTabs } from "@/components/classroom/ClassTabs";
import { EmptyState } from "@/components/classroom/EmptyState";
import { StudentsPanel } from "@/components/classroom/StudentsPanel";
import { TestList } from "@/components/classroom/TestList";
import { ButtonLink } from "@/components/ui/Button";
import { PageBody, PageHeader } from "@/components/ui/Page";
import { getClassroom, listStudents, listTests } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export default async function ClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const teacher = await requireOnboardedTeacher();
  const teacherId = String(teacher._id);
  const { classId } = await params;
  const { tab } = await searchParams;

  const room = await getClassroom(teacherId, classId);
  if (!room) notFound();

  const [students, tests] = await Promise.all([
    listStudents(teacherId, classId),
    listTests(teacherId, classId),
  ]);
  const active = tab === "students" ? "students" : "tests";
  const level = `Class ${room.grade}${room.section ?? ""}`;
  const newTest = (
    <ButtonLink href={`/classes/${classId}/tests/new`}>
      <Plus className="size-4" strokeWidth={2.4} />
      New test
    </ButtonLink>
  );

  return (
    <AppShell crumb={room.name} backHref="/classes" user={shellUser(teacher)}>
      <PageBody>
        <PageHeader
          title={room.name}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              <span className={`rounded-pill px-2 py-0.5 text-p5 font-semibold ${accentFor(room.subject).chip}`}>
                {room.subject}
              </span>
              <span>
                {level} · {room.school}
              </span>
            </span>
          }
          actions={<ClassActions classroom={room} />}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ClassTabs classId={classId} active={active} testCount={tests.length} studentCount={students.length} />
          {active === "tests" && tests.length > 0 && newTest}
        </div>

        {active === "students" ? (
          <StudentsPanel classId={classId} students={students} />
        ) : tests.length === 0 ? (
          <EmptyState
            title="No tests yet"
            body="Upload the question paper and, if you have one, your rubric. RedPen reads them once for the whole class."
            action={newTest}
          />
        ) : (
          <TestList classId={classId} tests={tests} studentCount={students.length} />
        )}
      </PageBody>
    </AppShell>
  );
}
