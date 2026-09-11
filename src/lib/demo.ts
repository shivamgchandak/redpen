import type { AnalysisResult, SheetPage } from "./types";

/**
 * The demo is a prepared result for the sample files, saved as static files
 * in public/demo (demo.json plus the page images). Opening it makes no model
 * calls, so it is instant, free and cannot be abused.
 */

export const DEMO_FILES = {
  question: { url: "/demo/question-paper.pdf", name: "question-paper.pdf" },
  answer: { url: "/demo/answer-sheet.pdf", name: "answer-sheet.pdf" },
  rubric: { url: "/demo/rubric.pdf", name: "rubric.pdf" },
} as const;

export type DemoKind = keyof typeof DEMO_FILES;

export const DEMO_FIXTURE_URL = "/demo/demo.json";
export const DEMO_GROUND_TRUTH_URL = "/demo/ground-truth.json";

/** How long the replayed loader runs. Long enough to follow, short enough to wait for. */
export const DEMO_REPLAY_MS = 11_000;

export interface DemoFileInfo {
  url: string;
  name: string;
  size: number;
  pages: number | null;
}

export interface DemoStep {
  label: string;
  value: number;
  /** When the step appears, in milliseconds; the loader squeezes these into DEMO_REPLAY_MS. */
  at: number;
}

export interface DemoFixture {
  version: 1;
  builtAt: string;
  elapsedMs: number;
  timeline: DemoStep[];
  result: AnalysisResult;
  pages: SheetPage[];
  files: Record<DemoKind, DemoFileInfo>;
}
