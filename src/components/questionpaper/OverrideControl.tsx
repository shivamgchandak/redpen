"use client";

import { useState, useTransition } from "react";
import { formatMark } from "@/lib/marks";
import { useGradeOverride } from "./OverrideContext";

export function OverrideControl({ questionNumber, maxMarks }: { questionNumber: string; maxMarks: number | null }) {
  const api = useGradeOverride();
  const current = api?.overrides[questionNumber] ?? null;
  const [value, setValue] = useState(current === null ? "" : String(current));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!api) return null;
  const original = api.original[questionNumber] ?? 0;

  const submit = (score: number | null) =>
    startTransition(async () => {
      const problem = await api.save(questionNumber, score);
      setError(problem);
      if (!problem && score === null) setValue("");
    });

  return (
    <div className="mt-3 flex flex-col gap-1.5 border-t border-hairline/60 pt-3" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-p5 text-muted">
          Your mark
          <input
            type="number"
            min={0}
            max={maxMarks ?? undefined}
            step={0.5}
            value={value}
            placeholder={formatMark(original)}
            onChange={(e) => setValue(e.target.value)}
            className="h-8 w-16 rounded-field border border-hairline bg-surface px-2 text-p4 tabular-nums text-ink"
          />
          {maxMarks != null && <span>/ {maxMarks}</span>}
        </label>
        <button
          type="button"
          disabled={pending || value.trim() === ""}
          onClick={() => submit(Number(value))}
          className="h-8 rounded-pill bg-[#303030] px-3 text-p5 font-medium text-surface disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save mark"}
        </button>
        {current !== null && (
          <button
            type="button"
            disabled={pending}
            onClick={() => submit(null)}
            className="h-8 rounded-pill px-2 text-p5 text-muted hover:text-ink"
          >
            Use RedPen&apos;s {formatMark(original)}
          </button>
        )}
      </div>
      {error && <p className="text-p5 text-danger">{error}</p>}
    </div>
  );
}
