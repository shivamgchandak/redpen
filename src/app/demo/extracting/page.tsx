"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorState, ExtractingState } from "@/components/extracting";
import { AppShell } from "@/components/shell";
import { usePipeline } from "@/lib/store";

export default function ExtractingPage() {
  const router = useRouter();
  const { stage, progress, error, cancel, reset } = usePipeline();

  useEffect(() => {
    if (stage === "ready") router.replace("/demo/result");
    else if (stage === "idle") router.replace("/demo");
  }, [stage, router]);

  const back = useCallback(() => {
    cancel();
    router.push("/demo");
  }, [cancel, router]);

  const retry = useCallback(() => {
    reset();
    router.push("/demo");
  }, [reset, router]);

  if (stage === "error") {
    return (
      <AppShell crumb="Demo" onBack={back}>
        <ErrorState message={error} onRetry={retry} />
      </AppShell>
    );
  }

  return (
    <AppShell crumb="Demo" collapsedSidebar onBack={back}>
      <ExtractingState progress={progress} />
    </AppShell>
  );
}
