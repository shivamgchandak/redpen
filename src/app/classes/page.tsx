import { AppShell } from "@/components/shell";
import { ClassCard } from "@/components/classroom/ClassCard";
import { CreateClassButton } from "@/components/classroom/CreateClassButton";
import { EmptyState } from "@/components/classroom/EmptyState";
import { PageBody, PageHeader } from "@/components/ui/Page";
import { listClassrooms } from "@/server/queries";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export const metadata = { title: "My Classes | RedPen" };

function greeting(): string {
  // Teachers are in India; greet by Indian time rather than the server's.
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function ClassesPage() {
  const teacher = await requireOnboardedTeacher();
  const rooms = await listClassrooms(String(teacher._id));
  const firstName = (teacher.name || "").split(" ")[0];
  const students = rooms.reduce((n, r) => n + r.studentCount, 0);

  return (
    <AppShell crumb="My Classes" user={shellUser(teacher)}>
      <PageBody>
        <PageHeader
          title={firstName ? `${greeting()}, ${firstName}` : "My Classes"}
          subtitle={
            rooms.length > 0
              ? `${rooms.length} ${rooms.length === 1 ? "class" : "classes"} · ${students} students · ${teacher.school}`
              : teacher.school
          }
          actions={rooms.length > 0 ? <CreateClassButton school={teacher.school} /> : null}
        />

        {rooms.length === 0 ? (
          <EmptyState
            title="Create your first class"
            body="Add the class, subject and your students. Then upload a question paper and rubric once, and mark every answer sheet against it."
            action={<CreateClassButton school={teacher.school} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <ClassCard key={room.id} room={room} />
            ))}
            <CreateClassButton school={teacher.school} label="New class" variant="tile" />
          </div>
        )}
      </PageBody>
    </AppShell>
  );
}
