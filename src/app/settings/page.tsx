import { AppShell } from "@/components/shell";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requireOnboardedTeacher, shellUser } from "@/server/session";

export const metadata = { title: "Settings | RedPen" };

export default async function SettingsPage() {
  const teacher = await requireOnboardedTeacher();

  return (
    <AppShell crumb="Settings" backHref="/classes" user={shellUser(teacher)}>
      <section className="mx-auto flex w-full max-w-[640px] flex-col gap-6 px-4 py-8 sm:py-12">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-ink-strong">Settings</h1>
          <p className="text-p4 text-muted">Signed in as {teacher.email}</p>
        </div>

        <div className="rounded-card bg-surface p-5 sm:p-6">
          <h2 className="mb-4 text-p2 font-bold text-ink">Profile</h2>
          <ProfileForm
            name={teacher.name}
            school={teacher.school}
            next="stay"
            submitLabel="Save changes"
          />
        </div>
      </section>
    </AppShell>
  );
}
