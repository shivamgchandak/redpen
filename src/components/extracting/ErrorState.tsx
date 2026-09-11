"use client";

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Start over",
}: {
  message: string | null;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <section className="flex flex-1 items-center justify-center rounded-card bg-surface px-6">
      <div className="flex max-w-lg flex-col items-center gap-3 text-center">
        <p className="text-p2 font-bold text-ink">That didn&apos;t work</p>
        <p className="text-p4 text-muted">
          {message ?? "Something went wrong while reading the files."}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex h-11 items-center rounded-[64px] bg-ink px-6 text-p4 font-medium text-surface"
        >
          {retryLabel}
        </button>
      </div>
    </section>
  );
}
