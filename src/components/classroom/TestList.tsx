import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { StatusChip, TEST_STATUS } from "@/components/ui/StatusChip";
import type { TestSummaryDTO } from "@/lib/data/dto";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function TestList({
  classId,
  tests,
  studentCount,
}: {
  classId: string;
  tests: TestSummaryDTO[];
  studentCount: number;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {tests.map((t) => {
        const status = TEST_STATUS[t.status] ?? TEST_STATUS.draft;
        const locked = t.status === "locked";
        const href = locked ? `/classes/${classId}/tests/${t.id}` : `/classes/${classId}/tests/${t.id}/review`;
        const pct = studentCount > 0 ? Math.round((t.markedCount / studentCount) * 100) : 0;

        return (
          <li key={t.id}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-card border border-transparent bg-surface px-4 py-4 transition-all hover:border-brand/30 hover:shadow-[0_8px_20px_rgba(24,24,24,0.06)] sm:px-5"
            >
              <span className="hidden size-10 shrink-0 place-items-center rounded-field bg-surface-soft text-muted group-hover:text-brand sm:grid">
                <FileText className="size-5" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-p2 font-bold text-ink">{t.title}</span>
                  <StatusChip tone={status.tone}>{status.label}</StatusChip>
                </div>
                <p className="mt-0.5 text-p5 text-subtle">
                  {t.questionCount > 0 ? `${t.questionCount} questions · ` : ""}
                  {dateFormat.format(new Date(t.createdAt))}
                </p>
                {locked && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-full max-w-[220px] overflow-hidden rounded-pill bg-surface-dim">
                      <div className="h-full rounded-pill bg-brand-gradient" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-p5 tabular-nums text-muted">
                      {t.markedCount} of {studentCount} marked
                    </span>
                  </div>
                )}
              </div>
              <ChevronRight className="size-5 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
