"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { FeedbackPanel } from "./FeedbackPanel";
import { MarksPill } from "./MarksPill";
import { QuestionBadge, SubPartLabel } from "./QuestionBadge";
import type { Grade, MatchSource, Question } from "@/lib/types";

export interface QuestionRowProps {
  question: Question;
  grade: Grade | undefined;
  matched: boolean;
  matchSource: MatchSource | null;
  matchNote?: string | null;
  selected: boolean;
  open: boolean;
  onSelect: () => void;
  onToggle: () => void;
}

export function QuestionRow({
  question,
  grade,
  matched,
  matchSource,
  matchNote,
  selected,
  open,
  onSelect,
  onToggle,
}: QuestionRowProps) {
  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        className={cn(
          "cursor-pointer rounded-panel border bg-surface px-3 py-3.5 shadow-[0_1px_3px_rgba(24,24,24,0.05)] transition-colors sm:px-4",
          selected
            ? "border-brand/70"
            : "border-transparent hover:border-hairline/50"
        )}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <QuestionBadge question={question} selected={selected} />
          <SubPartLabel question={question} />

          <p className="min-w-0 flex-1 self-center break-words text-[16px] font-normal leading-relaxed text-ink">
            {question.text}
          </p>

          <MarksPill grade={grade} />

          <div className="flex h-[28px] w-[28px] items-center justify-center rounded-md bg-[#F6F6F6]">
            <button
              type="button"
              aria-label={open ? "Collapse" : "Expand"}
              onClick={(event) => {
                event.stopPropagation();
                onToggle();
              }}
              className="shrink-0 self-center text-subtle transition-transform"
            >
              <ChevronDown
                className={cn("size-5 text-black", open && "rotate-180")}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>

        {open && (
          <FeedbackPanel
            grade={grade}
            matched={matched}
            matchSource={matchSource}
            matchNote={matchNote}
          />
        )}
      </div>
    </li>
  );
}
