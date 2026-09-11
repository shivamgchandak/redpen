"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Region } from "@/lib/types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;
const DEFAULT_ZOOM = 0.8;
const SCROLL_MARGIN = 80;

export function useSheetPager(focusOn: Region | null) {
  const [page, setPage] = useState(0);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const offsetOf = useCallback((index: number) => {
    const container = scrollRef.current;
    const element = pageRefs.current[index];
    if (!container || !element) return null;
    return (
      element.getBoundingClientRect().top -
      container.getBoundingClientRect().top +
      container.scrollTop
    );
  }, []);

  const goToPage = useCallback(
    (index: number) => {
      const container = scrollRef.current;
      const top = offsetOf(index);
      if (!container || top === null) return;
      container.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
      setPage(index);
    },
    [offsetOf]
  );

  useEffect(() => {
    if (!focusOn) return;
    const container = scrollRef.current;
    const element = pageRefs.current[focusOn.page];
    const top = offsetOf(focusOn.page);
    if (!container || !element || top === null) return;
    container.scrollTo({
      top: Math.max(0, top + focusOn.y * element.clientHeight - SCROLL_MARGIN),
      behavior: "smooth",
    });
  }, [focusOn, offsetOf]);

  const onScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const probe = container.scrollTop + SCROLL_MARGIN;
    let current = 0;
    for (let index = 0; index < pageRefs.current.length; index++) {
      const top = offsetOf(index);
      if (top !== null && top <= probe) current = index;
    }
    setPage((previous) => (previous === current ? previous : current));
  }, [offsetOf]);

  return {
    page,
    zoom,
    scrollRef,
    pageRefs,
    goToPage,
    onScroll,
    zoomIn: () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))),
    zoomOut: () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))),
  };
}
