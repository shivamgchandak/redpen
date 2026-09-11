"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { Button, buttonClass } from "@/components/ui/Button";

export default function ClassesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppShell crumb="Something went wrong" backHref="/classes">
      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-card bg-surface p-6 text-center">
          <p className="text-p1 font-bold text-ink-strong">That page did not load</p>
          <p className="text-p4 text-muted">
            It may be a network hiccup or the database waking up. Your classes and marks are safe.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={reset}>
              Try again
            </Button>
            <Link href="/classes" className={buttonClass("outline", "sm")}>
              Back to my classes
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
