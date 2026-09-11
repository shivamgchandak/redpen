import { auth } from "@/auth";
import { ShellUserProvider } from "@/components/shell";

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? "Teacher", email: session.user.email ?? null }
    : null;

  return <ShellUserProvider user={user}>{children}</ShellUserProvider>;
}
