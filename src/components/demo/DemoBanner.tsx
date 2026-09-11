"use client";

import Link from "next/link";
import { useShellUser } from "@/components/shell";

export function DemoBanner() {
  const user = useShellUser();

  return (
    <div className="flex flex-col gap-2 rounded-panel border border-brand/20 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-p4 text-ink">
        <span className="font-semibold text-brand">Demo mode.</span>{" "}
        {user
          ? "Results here are not saved to your classes."
          : "Nothing is saved. Sign in to create classes and keep every student's marks."}
      </p>
      {user ? (
        <Link
          href="/classes"
          className="flex h-9 shrink-0 items-center justify-center rounded-pill bg-[#303030] px-4 text-p4 font-medium text-surface transition-colors hover:bg-[#3A3A3A]"
        >
          Go to my classes
        </Link>
      ) : null}
    </div>
  );
}
