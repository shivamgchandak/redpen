import { redirect } from "next/navigation";
import { CenteredCard } from "@/components/account/CenteredCard";
import { ProfileForm } from "@/components/account/ProfileForm";
import { requireTeacher } from "@/server/session";

export const metadata = { title: "Welcome | RedPen" };

export default async function OnboardingPage() {
  const teacher = await requireTeacher();
  if (teacher.school) redirect("/classes");

  return (
    <CenteredCard
      title="Welcome to RedPen"
      subtitle="One quick question before your first class. You can change this later in Settings."
    >
      <ProfileForm name={teacher.name} school="" next="classes" submitLabel="Continue" />
    </CenteredCard>
  );
}
