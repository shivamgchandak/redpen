import { cn } from "@/lib/cn";
import { formatMark } from "@/lib/marks";
import type { Grade } from "@/lib/types";

const FULL_MARKS_THRESHOLD = 0.6;

function toneFor(grade: Grade): string {
  if (!grade.counted) return "bg-surface-dim text-subtle line-through";

  const max = grade.maxMarks;
  const ratio = grade.score !== null && max ? grade.score / max : null;

  if (ratio === null) return "bg-surface-dim text-subtle";
  if (ratio >= FULL_MARKS_THRESHOLD) return "bg-success/10 text-success";
  if (ratio > 0) return "bg-warn/10 text-warn";
  return "bg-danger/10 text-danger";
}

export function MarksPill({ grade }: { grade: Grade | undefined }) {
  if (!grade) return null;

  const label =
    grade.score === null
      ? "Not marked"
      : grade.maxMarks == null
        ? formatMark(grade.score)
        : `${formatMark(grade.score)} / ${grade.maxMarks}`;

  return (
    <span
      className={cn(
        "mt-0.5 shrink-0 whitespace-nowrap rounded-pill px-2 py-0.5 text-p5 font-semibold tabular-nums",
        toneFor(grade)
      )}
    >
      {label}
    </span>
  );
}
