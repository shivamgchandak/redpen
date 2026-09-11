"use client";

import { useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import { StatTile } from "./StatTile";
import type { AnalysisResult } from "@/lib/types";

export function SummaryBar({
  result,
  onReset,
  resetLabel = "New paper",
}: {
  result: AnalysisResult;
  onReset?: () => void;
  resetLabel?: string;
}) {
  const { summary } = result;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-hero bg-surface px-4 py-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="-my-1 flex items-center justify-between gap-3 py-1 text-left lg:hidden"
      >
        <span className="flex items-baseline gap-2.5">
          <span className="text-p3 font-semibold text-ink">Grades</span>
          <span className="text-p4 font-bold tabular-nums text-ink">
            {summary.score}/{summary.maxScore}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={2}
        />
      </button>

      <div className={cn("flex-col gap-3 lg:contents", open ? "flex" : "hidden")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 min-[460px]:grid-cols-4 lg:contents">
          <StatTile
            value={`${summary.score}/${summary.maxScore}`}
            label="Total score"
            emphasis
          />
          <StatTile value={String(summary.attempted)} label="Attempted" />
          <StatTile
            value={String(summary.unattempted)}
            label="Unattempted"
            tone="danger"
          />
          <StatTile
            value={String(summary.unmatchedAnswers)}
            label="Unmatched answers"
            tone={summary.unmatchedAnswers > 0 ? "warn" : undefined}
          />
        </div>

        <p className="text-p5 leading-relaxed text-muted lg:min-w-[200px] lg:flex-1">
          {summary.overallFeedback}
        </p>

        <div className="flex items-center justify-between gap-3 lg:contents">
          <span className="text-[11px] text-subtle">
            {result.elapsedMs > 0 ? `${(result.elapsedMs / 1000).toFixed(1)} seconds` : ""}
          </span>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex shrink-0 items-center gap-1.5 rounded-pill border border-hairline px-3 py-1.5 text-p5 font-medium text-ink transition-colors hover:bg-surface-soft"
            >
              <RotateCcw className="size-3.5" strokeWidth={2} />
              {resetLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
