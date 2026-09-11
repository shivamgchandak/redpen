"use client";

import { cn } from "@/lib/cn";

export type PanelTab = "questions" | "sheet";

const TABS: { key: PanelTab; label: string }[] = [
  { key: "questions", label: "Questions" },
  { key: "sheet", label: "Answer Sheet" },
];

export function ViewTabs({
  value,
  onChange,
}: {
  value: PanelTab;
  onChange: (tab: PanelTab) => void;
}) {
  return (
    <div className="flex gap-1 rounded-pill bg-surface p-1 lg:hidden">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex-1 rounded-pill py-2 text-p4 font-medium transition-colors",
            value === key ? "bg-ink text-surface" : "text-muted"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
