import { cn } from "@/lib/cn";
import type { Question } from "@/lib/types";

export function QuestionBadge({
  question,
  selected,
}: {
  question: Question;
  selected: boolean;
}) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border-2 border-white/25 text-[20px] font-extrabold leading-none text-white",
        selected ? "bg-brand" : "bg-[#2B2B2B]/80"
      )}
    >
      {question.parent ?? question.display}
    </span>
  );
}

export function SubPartLabel({ question }: { question: Question }) {
  if (!question.parent) return null;

  const suffix = question.display
    .replace(String(question.parent), "")
    .replace(/[()\s]/g, "");

  return (
    <span className="mt-0.5 shrink-0 text-p5 font-semibold text-ink">
      {suffix}.
    </span>
  );
}
