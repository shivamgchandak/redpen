"use client";

import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";

export function SheetToolbar({
  zoom,
  page,
  pageCount,
  onZoomIn,
  onZoomOut,
  onPrevPage,
  onNextPage,
}: {
  zoom: number;
  page: number;
  pageCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}) {
  return (
    <header className="flex h-15 flex-wrap items-center justify-between gap-2 px-3 py-3 sm:flex-nowrap sm:gap-3 sm:px-4">
      <h2 className="text-[16px] font-bold text-surface">Answer Sheet</h2>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5">
          <button
            type="button"
            aria-label="Zoom out"
            onClick={onZoomOut}
            className="grid size-5 place-items-center text-surface"
          >
            <Minus className="size-3.5" strokeWidth={2.4} />
          </button>
          <span className="text-[14px] font-bold tabular-nums text-surface">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={onZoomIn}
            className="grid size-5 place-items-center text-surface"
          >
            <Plus className="size-3.5" strokeWidth={2.4} />
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-md bg-white/10 px-2.5 py-1.5">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={onPrevPage}
            className="grid size-5 place-items-center rounded-full text-surface disabled:text-surface/35"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </button>
          <span className="whitespace-nowrap text-[14px] font-bold tabular-nums text-surface">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount - 1}
            onClick={onNextPage}
            className="grid size-5 place-items-center rounded-full text-surface disabled:text-surface/35"
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
