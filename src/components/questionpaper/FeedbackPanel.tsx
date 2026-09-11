import { MatchNote } from "./MatchNote";
import { OverrideControl } from "./OverrideControl";
import type { Grade, MatchSource } from "@/lib/types";

export function FeedbackPanel({
  grade,
  matched,
  matchSource,
  matchNote,
}: {
  grade: Grade | undefined;
  matched: boolean;
  matchSource: MatchSource | null;
  matchNote?: string | null;
}) {
  const unattempted = grade?.verdict === "unattempted";

  return (
    <div className="mt-3 rounded-panel bg-surface-soft px-3 py-3 sm:px-4">
      <p className="text-[16px] font-bold text-ink">AI Feedback</p>
      <p className="mt-1 text-[14px] font-normal leading-relaxed text-muted">
        {grade?.feedback ?? "No feedback available."}
      </p>

      {matched && matchSource && (
        <MatchNote source={matchSource} note={matchNote} />
      )}

      {unattempted && (
        <p className="mt-2 text-[12px] text-subtle">
          Nothing on the answer sheet maps to this question.
        </p>
      )}

      {grade?.reviewNote && (
        <p className="mt-2 text-[12px] font-medium text-warn">
          {grade.reviewNote}
        </p>
      )}

      {grade && grade.counted && (
        <OverrideControl questionNumber={grade.questionNumber} maxMarks={grade.maxMarks} />
      )}
    </div>
  );
}
