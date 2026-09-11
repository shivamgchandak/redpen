"use client";

import { cn } from "@/lib/cn";
import { MAX_SPLIT, MIN_SPLIT, type SplitPane } from "./useSplitPane";

export function SplitHandle({ pane }: { pane: SplitPane }) {
  const { split, dragging, startDrag, endDrag, moveTo, reset, onKeyDown } = pane;

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panels"
      aria-valuenow={Math.round(split)}
      aria-valuemin={MIN_SPLIT}
      aria-valuemax={MAX_SPLIT}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onDoubleClick={reset}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        startDrag();
      }}
      onPointerMove={(event) => {
        if (dragging) moveTo(event.clientX);
      }}
      onPointerUp={(event) => {
        event.currentTarget.releasePointerCapture(event.pointerId);
        endDrag();
      }}
      onPointerCancel={endDrag}
      style={{ left: "var(--split)" }}
      className="group absolute inset-y-0 z-20 hidden w-[18px] -translate-x-1/2 cursor-col-resize touch-none items-center justify-center outline-none lg:flex"
    >
      <span
        className={cn(
          "h-[71px] w-[18px] rounded-[48px] bg-white/80 shadow-[0_4px_22.5px_0_rgba(0,0,0,0.25)] transition-colors",
          dragging && "bg-brand",
          !dragging && "group-hover:bg-brand group-focus-visible:bg-brand"
        )}
      />
    </div>
  );
}
