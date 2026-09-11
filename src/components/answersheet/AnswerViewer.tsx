"use client";

import { useMemo } from "react";
import { SheetFooter } from "./SheetFooter";
import { SheetPageView } from "./SheetPageView";
import { SheetToolbar } from "./SheetToolbar";
import { splitRegions } from "./answerRegions";
import { useSheetPager } from "./useSheetPager";
import type { AnalysisResult, SheetPage } from "@/lib/types";

export function AnswerViewer({
  result,
  pages,
  selected,
}: {
  result: AnalysisResult;
  pages: SheetPage[];
  selected: string | null;
}) {
  const { active, others } = useMemo(
    () => splitRegions(result, selected),
    [result, selected]
  );

  const focusOn = active?.regions[0] ?? null;
  const pager = useSheetPager(focusOn);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-ink-strong">
      <SheetToolbar
        zoom={pager.zoom}
        page={pager.page}
        pageCount={pages.length}
        onZoomIn={pager.zoomIn}
        onZoomOut={pager.zoomOut}
        onPrevPage={() => pager.goToPage(pager.page - 1)}
        onNextPage={() => pager.goToPage(pager.page + 1)}
      />

      <div
        ref={pager.scrollRef}
        onScroll={pager.onScroll}
        className="min-h-0 flex-1 overflow-auto bg-ink-strong"
      >
        <div
          className="mx-auto flex flex-col gap-2"
          style={{
            width: `${pager.zoom * 100}%`,
            maxWidth: pager.zoom <= 1 ? "100%" : "none",
          }}
        >
          {pages.map((sheet, index) => (
            <SheetPageView
              key={index}
              sheet={sheet}
              index={index}
              active={active}
              others={others}
              pageRef={(element) => {
                pager.pageRefs.current[index] = element;
              }}
            />
          ))}
        </div>
      </div>

      <SheetFooter active={active} selected={selected} />
    </div>
  );
}
