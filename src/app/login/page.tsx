import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CenteredCard } from "@/components/account/CenteredCard";
import { GoogleSignInButton } from "@/components/auth";

export const metadata = { title: "Sign in | RedPen" };

function safePath(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return "/classes";
  try {
    // Auth.js passes a full URL; keep only the path on this site.
    const url = new URL(v, "http://local");
    const path = `${url.pathname}${url.search}`;
    return path.startsWith("/") && !path.startsWith("//") ? path : "/classes";
  } catch {
    return "/classes";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[]; error?: string }>;
}) {
  const params = await searchParams;
  const next = safePath(params.callbackUrl);

  const session = await auth();
  if (session?.user) redirect(next);

  return (
    <CenteredCard
      title="Sign in to RedPen"
      subtitle="Use your Google account. Your classes, tests and marks are private to you."
    >
      {params.error && (
        <p role="alert" className="rounded-field bg-danger/10 px-3 py-2 text-p4 text-danger">
          Signing in did not work. Please try again.
        </p>
      )}

      <GoogleSignInButton redirectTo={next} className="w-full" />

      <p className="text-center text-p5 text-subtle">
        Just looking?{" "}
        <Link href="/demo" className="font-medium text-brand hover:underline">
          Try the demo without signing in
        </Link>
      </p>
    </CenteredCard>
  );
}
