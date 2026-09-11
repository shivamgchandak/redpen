"use client";

import { create } from "zustand";
import { clearSnapshot, readSnapshot, saveSnapshot } from "./snapshot";
import { DEMO_FIXTURE_URL, DEMO_REPLAY_MS, type DemoFixture, type DemoKind } from "./demo";
import type { AnalysisResult, SheetPage, SourceDoc, Stage } from "./types";

type Progress = { label: string; value: number } | null;

interface PipelineState {
  stage: Stage;
  question: SourceDoc | null;
  answer: SourceDoc | null;
  rubric: SourceDoc | null;
  result: AnalysisResult | null;
  error: string | null;
  selected: string | null;
  progress: Progress;
  demo: DemoFixture | null;

  setDoc: (doc: SourceDoc, file: File) => void;
  clearDoc: (kind: SourceDoc["kind"]) => void;
  select: (questionNumber: string | null) => void;

  /** Demo: load the saved run and show its files as already uploaded. */
  loadDemo: () => Promise<boolean>;
  /** Demo: replay the saved run's progress, then show its result. No model calls. */
  playDemo: () => Promise<void>;

  cancel: () => void;
  reset: () => void;
  restore: () => boolean;
}

const files: Partial<Record<SourceDoc["kind"], File>> = {};

let replayToken = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const usePipeline = create<PipelineState>((set, get) => ({
  stage: "idle",
  question: null,
  answer: null,
  rubric: null,
  result: null,
  error: null,
  selected: null,
  progress: null,
  demo: null,

  setDoc: (doc, file) => {
    files[doc.kind] = file;
    set({ [doc.kind]: doc } as Partial<PipelineState>);
  },

  clearDoc: (kind) => {
    delete files[kind];
    set({ [kind]: null } as Partial<PipelineState>);
  },

  select: (selected) => set({ selected }),

  loadDemo: async () => {
    let demo = get().demo;
    if (!demo) {
      try {
        const res = await fetch(DEMO_FIXTURE_URL, { cache: "no-store" });
        if (!res.ok) return false;
        demo = (await res.json()) as DemoFixture;
      } catch {
        return false;
      }
    }

    const doc = (kind: DemoKind): SourceDoc => ({
      kind: kind === "question" ? "question" : kind === "answer" ? "answer" : "rubric",
      name: demo!.files[kind].name,
      size: demo!.files[kind].size,
      pages: demo!.files[kind].pages,
      mime: "application/pdf",
    });

    set({ demo, question: doc("question"), answer: doc("answer"), rubric: doc("rubric") });
    return true;
  },

  playDemo: async () => {
    const demo = get().demo;
    if (!demo) return;
    const token = ++replayToken;

    set({ stage: "extracting", error: null, progress: { label: "Preparing files", value: 0 } });

    // Replay the real run's steps in their real order, squeezed into a short loader.
    const steps = demo.timeline.length > 0 ? demo.timeline : [{ label: "Marking answers", value: 0.9, at: 1 }];
    const span = Math.max(1, steps[steps.length - 1].at);
    let elapsed = 0;

    for (const step of steps) {
      const target = (step.at / span) * DEMO_REPLAY_MS;
      await sleep(Math.max(0, target - elapsed));
      elapsed = Math.max(elapsed, target);
      if (token !== replayToken) return;
      set({ progress: { label: step.label, value: step.value } });
    }

    await sleep(400);
    if (token !== replayToken) return;

    answerImages.pages = demo.pages;
    const selected = null;
    set({ stage: "ready", result: demo.result, progress: null, selected });
    saveSnapshot({ result: demo.result, selected, pages: demo.pages });
  },

  cancel: () => {
    replayToken++;
    set({ stage: "idle", progress: null, error: null });
  },

  reset: () => {
    replayToken++;
    delete files.question;
    delete files.answer;
    delete files.rubric;
    answerImages.pages = [];
    clearSnapshot();
    set({
      stage: "idle",
      result: null,
      error: null,
      selected: null,
      progress: null,
    });
  },

  restore: () => {
    const snapshot = readSnapshot();
    if (!snapshot) return false;

    answerImages.pages = snapshot.pages ?? [];
    set({
      stage: "ready",
      result: snapshot.result,
      selected: snapshot.selected ?? null,
      progress: null,
      error: null,
    });
    return true;
  },
}));

export const answerImages: { pages: SheetPage[] } = {
  pages: [],
};
