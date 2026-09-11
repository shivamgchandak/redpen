"use client";

import type { AnalysisResult, SheetPage } from "./types";

const SNAPSHOT_KEY = "redpen:last-result";

export interface Snapshot {
  result: AnalysisResult;
  selected: string | null;
  pages: SheetPage[];
}

export function saveSnapshot(snapshot: Snapshot): void {
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    return;
  }
}

export function readSnapshot(): Snapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;

    const snapshot = JSON.parse(raw) as Snapshot;
    if (!snapshot?.result?.questions?.length) return null;

    return snapshot;
  } catch {
    clearSnapshot();
    return null;
  }
}

export function clearSnapshot(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    return;
  }
}
