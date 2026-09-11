"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { overrideMark } from "@/app/actions/submissions";
import { GradeOverrideProvider, type GradeOverrideApi } from "@/components/questionpaper";
import { ResultScreen } from "@/components/result";
import { buttonClass } from "@/components/ui/Button";
import type { AnalysisResult, SheetPage } from "@/lib/types";

export function TeacherResult({
  result,
  pages,
  submissionId,
  studentName,
  rollNo,
  original,
  overrides,
  backHref,
  nextHref,
  nextLabel,
  notice = null,
}: {
  result: AnalysisResult;
  pages: SheetPage[];
  submissionId: string;
  studentName: string;
  rollNo: string;
  original: Record<string, number | null>;
  overrides: Record<string, number | null>;
  backHref: string;
  nextHref: string | null;
  nextLabel: string | null;
  notice?: string | null;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const api = useMemo<GradeOverrideApi>(
    () => ({
      original,
      overrides,
      save: async (questionNumber, score) => {
        const res = await overrideMark({ submissionId, questionNumber, score });
        if (!res?.ok) return res?.message ?? "Could not save.";
        router.refresh();
        return null;
      },
    }),
    [original, overrides, submissionId, router]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
      <div className="flex flex-col gap-2 rounded-hero bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-p2 font-bold text-ink">
            {rollNo ? <span className="mr-2 text-subtle">{rollNo}</span> : null}
            {studentName}
          </p>
          <p className="text-p5 text-subtle">Open a question to see the feedback or change its mark.</p>
        </div>
        <div className="flex gap-2">
          <Link href={backHref} className={buttonClass("outline", "sm", "flex-1 sm:flex-none")}>
            All students
          </Link>
          {nextHref && (
            <Link href={nextHref} className={buttonClass("primary", "sm", "flex-1 sm:flex-none")}>
              {nextLabel ?? "Next student"}
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-panel border border-success/30 bg-success/5 px-4 py-2.5 text-p4 text-ink">
          {notice}
        </p>
      )}

      <GradeOverrideProvider value={api}>
        <ResultScreen result={result} pages={pages} selected={selected} onSelect={setSelected} />
      </GradeOverrideProvider>
    </div>
  );
}
