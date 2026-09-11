import { cn } from "@/lib/cn";

export type StatTone = "danger" | "warn";

export function StatTile({
  value,
  label,
  tone,
  emphasis,
}: {
  value: string;
  label: string;
  tone?: StatTone;
  emphasis?: boolean;
}) {
  return (
    <div className="shrink-0">
      <p
        className={cn(
          "tabular-nums",
          emphasis ? "text-p2 font-bold" : "text-p3 font-semibold",
          tone === "danger"
            ? "text-danger"
            : tone === "warn"
              ? "text-warn"
              : "text-ink"
        )}
      >
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-wide text-subtle">{label}</p>
    </div>
  );
}
