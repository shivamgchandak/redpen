"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorState, ExtractingState } from "@/components/extracting";
import type { ProgressDTO } from "@/lib/data/dto";
import { isStale, postJson, useAutoRefresh } from "./useAutoRefresh";

/**
 * Shown while a test's paper and rubric are read in the background. The
 * teacher can leave; this page polls the saved progress and switches to the
 * rubric editor by itself when reading is done.
 */
export function ReadTestPanel({
  testId,
  status,
  error,
  progress,
}: {
  testId: string;
  status: "draft" | "reading" | "failed";
  error: string | null;
  progress: ProgressDTO | null;
}) {
  const router = useRouter();
  const [startError, setStartError] = useState<string | null>(null);
  const started = useRef(false);

  const stuck = status === "reading" && isStale(progress?.updatedAt);

  const begin = useCallback(async () => {
    setStartError(null);
    try {
      await postJson(`/api/tests/${testId}/read`);
      router.refresh();
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err));
    }
  }, [router, testId]);

  useEffect(() => {
    if (status === "draft" && !started.current) {
      started.current = true;
      void begin();
    }
  }, [status, begin]);

  useAutoRefresh(status !== "failed" && !stuck && !startError, 2500);

  if (status === "failed" || stuck || startError) {
    return (
      <div className="flex min-h-[420px] flex-1">
        <ErrorState
          message={
            startError ??
            (stuck ? "Reading seems to have stopped. You can safely start it again." : error)
          }
          retryLabel="Try reading again"
          onRetry={begin}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-1 flex-col gap-3">
      <ExtractingState
        title="Reading the paper..."
        subtitle="Once per test. Usually under a minute."
        progress={progress ? { label: progress.label, value: progress.value } : { label: "Starting", value: 0.02 }}
      />
      <p className="text-center text-p5 text-subtle">
        This runs in the background. You can leave this page and come back.
      </p>
    </div>
  );
}
