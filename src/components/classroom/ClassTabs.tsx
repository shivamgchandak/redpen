import Link from "next/link";
import { cn } from "@/lib/cn";

export function ClassTabs({
  classId,
  active,
  testCount,
  studentCount,
}: {
  classId: string;
  active: "tests" | "students";
  testCount: number;
  studentCount: number;
}) {
  const tabs = [
    { key: "tests", label: "Tests", count: testCount, href: `/classes/${classId}` },
    { key: "students", label: "Students", count: studentCount, href: `/classes/${classId}?tab=students` },
  ] as const;

  return (
    <nav className="flex w-full gap-1 rounded-pill bg-surface p-1 sm:w-auto sm:self-start" aria-label="Class sections">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-pill px-5 py-2 text-p4 font-medium transition-colors sm:flex-none",
            active === t.key ? "bg-[#303030] text-surface" : "text-muted hover:text-ink"
          )}
        >
          {t.label}
          <span
            className={cn(
              "rounded-pill px-1.5 text-p5 tabular-nums",
              active === t.key ? "bg-white/15 text-surface" : "bg-surface-dim text-muted"
            )}
          >
            {t.count}
          </span>
        </Link>
      ))}
    </nav>
  );
}
