"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DemoResultNote } from "@/components/demo";
import { AppShell } from "@/components/shell";
import { ResultScreen } from "@/components/result";
import { answerImages, usePipeline } from "@/lib/store";

export default function ResultPage() {
  const router = useRouter();
  const { result, selected, select, reset, restore } = usePipeline();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (result) {
      setChecked(true);
      return;
    }
    const recovered = restore();
    setChecked(true);
    if (!recovered) router.replace("/demo");
  }, [result, restore, router]);

  const back = useCallback(() => {
    reset();
    router.push("/demo");
  }, [reset, router]);

  if (!checked || !result) return null;

  return (
    <AppShell
      crumb="Demo"
      collapsedSidebar
      onBack={back}
      banner={<DemoResultNote />}
    >
      <ResultScreen
        result={result}
        pages={answerImages.pages}
        selected={selected}
        onSelect={select}
        onReset={back}
      />
    </AppShell>
  );
}
