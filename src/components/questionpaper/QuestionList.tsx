"use client";

import { useMemo, useState } from "react";
import { QuestionListHeader } from "./QuestionListHeader";
import { QuestionRow } from "./QuestionRow";
import { UnmatchedAnswers } from "./UnmatchedAnswers";
import type { AnalysisResult } from "@/lib/types";

export function QuestionList({
  result,
  selected,
  onSelect,
}: {
  result: AnalysisResult;
  selected: string | null;
  onSelect: (questionNumber: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [allOpen, setAllOpen] = useState(false);

  const gradeByNumber = useMemo(
    () => new Map(result.grades.map((grade) => [grade.questionNumber, grade])),
    [result.grades]
  );

  const mappingByNumber = useMemo(
    () => new Map(result.mappings.map((m) => [m.questionNumber, m])),
    [result.mappings]
  );

  const unmatched = useMemo(
    () =>
      result.answers.filter(
        (answer) => !result.mappings.some((m) => m.answerId === answer.id)
      ),
    [result.answers, result.mappings]
  );

  function toggleOne(questionNumber: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(questionNumber)) next.delete(questionNumber);
      else next.add(questionNumber);
      return next;
    });
  }

  function toggleAll() {
    const next = !allOpen;
    setAllOpen(next);
    setExpanded(
      next ? new Set(result.questions.map((q) => q.number)) : new Set()
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col rounded-card bg-white/50">
      <QuestionListHeader allOpen={allOpen} onToggleAll={toggleAll} />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-2 sm:px-3">
        <ul className="flex flex-col gap-2">
          {result.questions.map((question) => {
            const mapping = mappingByNumber.get(question.number);

            return (
              <QuestionRow
                key={question.number}
                question={question}
                grade={gradeByNumber.get(question.number)}
                matched={Boolean(mapping?.answerId)}
                matchSource={mapping?.source ?? null}
                matchNote={mapping?.note ?? null}
                selected={selected === question.number}
                open={expanded.has(question.number)}
                onSelect={() => onSelect(question.number)}
                onToggle={() => toggleOne(question.number)}
              />
            );
          })}
        </ul>

        <UnmatchedAnswers answers={unmatched} />
      </div>
    </div>
  );
}
