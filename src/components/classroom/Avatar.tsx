import { cn } from "@/lib/cn";

const TINTS = [
  "bg-brand/10 text-brand",
  "bg-warn/10 text-warn",
  "bg-success/10 text-success",
  "bg-ink/5 text-ink",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

/** Initials in a tinted circle; the tint is stable for a given name. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-pill text-p5 font-bold",
        TINTS[hash % TINTS.length],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
