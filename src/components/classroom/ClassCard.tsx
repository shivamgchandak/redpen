import Link from "next/link";
import { ArrowUpRight, ClipboardList, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClassroomSummaryDTO } from "@/lib/data/dto";

const ACCENTS = [
  { bar: "bg-brand", chip: "bg-brand/10 text-brand" },
  { bar: "bg-warn", chip: "bg-warn/10 text-warn" },
  { bar: "bg-success", chip: "bg-success/10 text-success" },
  { bar: "bg-[#303030]", chip: "bg-ink/5 text-ink" },
];

/** A stable colour per subject, so "Biology" looks the same on every card. */
export function accentFor(subject: string) {
  const hash = [...subject.toLowerCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  return ACCENTS[hash % ACCENTS.length];
}

export function ClassCard({ room }: { room: ClassroomSummaryDTO }) {
  const level = `Class ${room.grade}${room.section ?? ""}`;
  const accent = accentFor(room.subject);

  return (
    <Link
      href={`/classes/${room.id}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-card border border-transparent bg-surface p-5 pt-6 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-[0_12px_28px_rgba(24,24,24,0.08)]"
    >
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", accent.bar)} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={cn("inline-flex rounded-pill px-2 py-0.5 text-p5 font-semibold", accent.chip)}>
            {room.subject}
          </span>
          <h2 className="mt-2 truncate text-p1 font-bold text-ink-strong">{room.name}</h2>
          <p className="truncate text-p5 text-subtle">
            {level} · {room.school}
          </p>
        </div>
        <ArrowUpRight className="size-5 shrink-0 text-subtle transition-colors group-hover:text-brand" />
      </div>

      <div className="flex gap-5 border-t border-hairline/60 pt-3 text-p4 text-muted">
        <span className="flex items-center gap-1.5">
          <Users className="size-4" />
          <span className="font-semibold text-ink">{room.studentCount}</span>
          {room.studentCount === 1 ? "student" : "students"}
        </span>
        <span className="flex items-center gap-1.5">
          <ClipboardList className="size-4" />
          <span className="font-semibold text-ink">{room.testCount}</span>
          {room.testCount === 1 ? "test" : "tests"}
        </span>
      </div>
    </Link>
  );
}
