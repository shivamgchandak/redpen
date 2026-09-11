"use client";

import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth";
import { useShellUser } from "@/components/shell";

/** Keeps the demo honest: it says plainly that this is a prepared example. */
export function DemoResultNote() {
  const user = useShellUser();

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-brand/20 bg-surface px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-p5 text-ink sm:text-p4">
        <span className="mr-1.5 rounded-pill bg-brand/10 px-2 py-0.5 text-p5 font-semibold text-brand">Demo</span>
        A prepared example on a sample answer sheet, marked against the sample rubric.
      </p>
      {user ? (
        <Link
          href="/classes"
          className="flex h-9 shrink-0 items-center justify-center rounded-pill bg-[#303030] px-4 text-p4 font-medium text-surface hover:bg-[#3A3A3A]"
        >
          Mark your own class
        </Link>
      ) : (
        <GoogleSignInButton size="sm" variant="dark" label="Sign in to mark your own class" className="shrink-0" />
      )}
    </div>
  );
}
