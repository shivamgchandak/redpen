import { cn } from "@/lib/cn";

const TONES = {
  neutral: "bg-surface-dim text-muted",
  brand: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warn: "bg-warn/10 text-warn",
  danger: "bg-danger/10 text-danger",
} as const;

export type ChipTone = keyof typeof TONES;

export function StatusChip({ tone = "neutral", children }: { tone?: ChipTone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center whitespace-nowrap rounded-pill px-2.5 py-0.5 text-p5 font-semibold", TONES[tone])}>
      {children}
    </span>
  );
}

export const TEST_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  draft: { label: "Not read yet", tone: "neutral" },
  reading: { label: "Reading", tone: "brand" },
  review: { label: "Check rubric", tone: "warn" },
  locked: { label: "Ready to mark", tone: "success" },
  failed: { label: "Reading failed", tone: "danger" },
};

export const SUBMISSION_STATUS: Record<string, { label: string; tone: ChipTone }> = {
  uploaded: { label: "Not marked", tone: "neutral" },
  queued: { label: "Queued", tone: "brand" },
  reading: { label: "Marking", tone: "brand" },
  mapping: { label: "Marking", tone: "brand" },
  grading: { label: "Marking", tone: "brand" },
  done: { label: "Marked", tone: "success" },
  needs_review: { label: "Needs review", tone: "warn" },
  failed: { label: "Failed", tone: "danger" },
};
