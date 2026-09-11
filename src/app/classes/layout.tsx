import { auth } from "@/auth";
import { ShellUserProvider } from "@/components/shell";

/**
 * Shares the current teacher with everything under /classes, including
 * the loading and error screens, from the session cookie alone.
 */
export default async function ClassesLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? "Teacher", email: session.user.email ?? null }
    : null;
  return <ShellUserProvider user={user}>{children}</ShellUserProvider>;
}
