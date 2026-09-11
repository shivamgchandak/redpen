"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const DEFAULT_SPLIT = (672 / (672 + 659)) * 100;
export const MIN_SPLIT = 30;
export const MAX_SPLIT = 70;

const clamp = (value: number) => Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, value));

export interface SplitPane {
  split: number;
  dragging: boolean;
  rowRef: React.RefObject<HTMLDivElement | null>;
  startDrag: () => void;
  endDrag: () => void;
  moveTo: (clientX: number) => void;
  reset: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

export function useSplitPane(): SplitPane {
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  const moveTo = useCallback((clientX: number) => {
    const row = rowRef.current;
    if (!row) return;
    const rect = row.getBoundingClientRect();
    if (rect.width === 0) return;
    setSplit(clamp(((clientX - rect.left) / rect.width) * 100));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const { style } = document.body;
    const previousCursor = style.cursor;
    const previousSelect = style.userSelect;
    style.cursor = "col-resize";
    style.userSelect = "none";
    return () => {
      style.cursor = previousCursor;
      style.userSelect = previousSelect;
    };
  }, [dragging]);

  const onKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") setSplit((v) => clamp(v - 2));
    else if (event.key === "ArrowRight") setSplit((v) => clamp(v + 2));
    else if (event.key === "Home") setSplit(DEFAULT_SPLIT);
    else return;
    event.preventDefault();
  }, []);

  return {
    split,
    dragging,
    rowRef,
    startDrag: useCallback(() => setDragging(true), []),
    endDrag: useCallback(() => setDragging(false), []),
    moveTo,
    reset: useCallback(() => setSplit(DEFAULT_SPLIT), []),
    onKeyDown,
  };
}
