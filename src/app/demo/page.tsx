"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoBanner } from "@/components/demo";
import { PdfPreview } from "@/components/demo/PdfPreview";
import { UploadScreen } from "@/components/home";
import { AppShell } from "@/components/shell";
import { DEMO_FILES, type DemoKind } from "@/lib/demo";
import { usePipeline } from "@/lib/store";
import type { SourceDoc } from "@/lib/types";

const TITLES: Record<DemoKind, string> = {
  question: "Question paper",
  answer: "Answer sheet",
  rubric: "Rubric",
};

const noop = () => {};

export default function DemoUploadPage() {
  const router = useRouter();
  const { question, answer, rubric, loadDemo, playDemo } = usePipeline();
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [preview, setPreview] = useState<DemoKind | null>(null);

  useEffect(() => {
    let alive = true;
    void loadDemo().then((ok) => {
      if (alive) setStatus(ok ? "ready" : "missing");
    });
    return () => {
      alive = false;
    };
  }, [loadDemo]);

  const start = useCallback(() => {
    void playDemo();
    router.push("/demo/extracting");
  }, [playDemo, router]);

  const openPreview = useCallback((kind: SourceDoc["kind"]) => {
    const key = kind as DemoKind;
    // Phones show PDFs badly inside a page, so give them the whole tab.
    if (window.matchMedia("(max-width: 640px)").matches) {
      window.open(DEMO_FILES[key].url, "_blank", "noopener");
      return;
    }
    setPreview(key);
  }, []);

  return (
    <AppShell crumb="Demo" banner={<DemoBanner />} onBack={() => router.push("/")}>
      {status === "missing" ? (
        <section className="flex flex-1 items-center justify-center px-4 py-10">
          <div className="flex max-w-md flex-col items-center gap-3 rounded-card bg-surface p-6 text-center">
            <p className="text-p2 font-bold text-ink">The demo could not load</p>
            <p className="text-p4 text-muted">Please try again in a moment, or sign in to try it on your own papers.</p>
          </div>
        </section>
      ) : (
        <UploadScreen
          question={question}
          answer={answer}
          rubric={rubric}
          showRubric
          locked
          onSelect={noop}
          onClear={noop}
          onStart={start}
          onPreview={openPreview}
          subtitle="A sample Class X Biology paper, a student's handwritten answers and the teacher's rubric."
          footnote="The demo shows a prepared result for these files, so it is instant and free. Sign in to mark your own papers."
        />
      )}

      <PdfPreview
        url={preview ? DEMO_FILES[preview].url : null}
        title={preview ? TITLES[preview] : ""}
        onClose={() => setPreview(null)}
      />
    </AppShell>
  );
}
