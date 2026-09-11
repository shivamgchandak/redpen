"use client";

import Image from "next/image";
import ExtractingSparkel from "../../../public/images/ExtractingSparkelRed.png";

export function ExtractingState({
  progress,
  title = "Extracting...",
  subtitle = "This may take a while",
}: {
  progress: { label: string; value: number } | null;
  title?: string;
  subtitle?: string;
}) {
  const value = progress?.value ?? 0;
  const percent = Math.round(value * 100);

  return (
    <section className="flex flex-1 items-center justify-center rounded-card bg-surface px-6">
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <span className="relative grid place-items-center">
          <Image
            src={ExtractingSparkel}
            alt=""
            width={130}
            height={130}
            className="animate-pulse"
          />
        </span>

        <div className="flex flex-col items-center justify-center">
          <p className="bg-[linear-gradient(90deg,#303030_0%,#606060_25%,#808080_50%,#606060_75%,#303030_100%)] bg-clip-text text-[30px] font-bold text-transparent">
            {title}
          </p>
          <p className="text-center text-[18px] font-normal text-subtle sm:text-[20px]">
            {subtitle}
          </p>
        </div>

        <div
          className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-surface-dim"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label="Extraction progress"
        >
          <div
            className="h-full rounded-pill bg-brand-gradient transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(2, value * 100)}%` }}
          />
        </div>

        <div className="flex w-full items-baseline justify-between gap-3">
          <p className="text-p4 text-muted">
            {progress?.label ?? "This may take a while"}
          </p>
          <span className="shrink-0 text-p5 tabular-nums text-subtle">
            {percent}%
          </span>
        </div>
      </div>
    </section>
  );
}
