"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { AnswerViewer } from "@/components/answersheet";
import { SplitHandle, useSplitPane } from "@/components/dragger";
import { QuestionList } from "@/components/questionpaper";
import { SummaryBar } from "./SummaryBar";
import { ViewTabs, type PanelTab } from "./ViewTabs";
import type { AnalysisResult, SheetPage } from "@/lib/types";

export function ResultScreen({
  result,
  pages,
  selected,
  onSelect,
  onReset,
}: {
  result: AnalysisResult;
  pages: SheetPage[];
  selected: string | null;
  onSelect: (questionNumber: string) => void;
  onReset?: () => void;
}) {
  const [tab, setTab] = useState<PanelTab>("questions");
  const pane = useSplitPane();

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <SummaryBar result={result} onReset={onReset} resetLabel="Run the demo again" />

      <ViewTabs value={tab} onChange={setTab} />

      <div
        ref={pane.rowRef}
        className="relative flex min-h-0 flex-1 gap-3"
        style={{ ["--split" as string]: `${pane.split}%` }}
      >
        <div
          className={cn(
            "min-h-0 min-w-0 rounded-card lg:flex lg:flex-[0_0_calc(var(--split)_-_6px)]",
            tab === "questions" ? "flex flex-1" : "hidden"
          )}
        >
          <QuestionList
            result={result}
            selected={selected}
            onSelect={onSelect}
          />
        </div>

        <SplitHandle pane={pane} />

        <div
          className={cn(
            "min-h-0 min-w-0 lg:flex lg:flex-[1_1_0%]",
            tab === "sheet" ? "flex flex-1" : "hidden"
          )}
        >
          <AnswerViewer result={result} pages={pages} selected={selected} />
        </div>
      </div>
    </section>
  );
}
