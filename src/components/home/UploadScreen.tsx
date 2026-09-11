"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import { Dropzone } from "./Dropzone";
import RightArrow from "../../../public/images/RightArrow.png";
import TeacherBatch from "../../../public/images/AILadyRed.png";
import type { SourceDoc } from "@/lib/types";

type Kind = SourceDoc["kind"];

export function UploadScreen({
  question,
  answer,
  rubric = null,
  showRubric = false,
  locked = false,
  onSelect,
  onClear,
  onStart,
  onPreview,
  subtitle = "Upload both files to get started",
  footnote = "Once both files are uploaded, you'll be able to map answers to questions",
}: {
  question: SourceDoc | null;
  answer: SourceDoc | null;
  rubric?: SourceDoc | null;
  showRubric?: boolean;
  /** Demo: files are fixed and can only be previewed. */
  locked?: boolean;
  onSelect: (doc: SourceDoc, file: File) => void;
  onClear: (kind: Kind) => void;
  onStart: () => void;
  onPreview?: (kind: Kind) => void;
  subtitle?: string;
  footnote?: string;
}) {
  const ready = Boolean(question && answer);
  const slots: { kind: Kind; doc: SourceDoc | null }[] = [
    { kind: "question", doc: question },
    { kind: "answer", doc: answer },
    ...(showRubric ? [{ kind: "rubric" as Kind, doc: rubric }] : []),
  ];

  return (
    <section className="flex flex-1 items-center justify-center rounded-hero px-4 py-8 sm:py-10">
      <div className="flex w-full max-w-[1103px] flex-col items-center gap-7 sm:gap-9">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[24px] font-bold leading-[1.2] tracking-[-0.04em] md:text-[32px] lg:text-[40px]">
            Upload{" "}
            <span className="rounded-field text-ink md:bg-brand/10 md:px-2 md:py-0.5 md:text-brand lg:px-3 lg:py-1 lg:text-brand">
              Question Paper and Answer Sheets
            </span>
          </h1>
          <p className="text-p3 text-muted md:text-[20px]">{subtitle}</p>
        </div>

        <Image
          src={TeacherBatch}
          alt=""
          width={140}
          height={140}
          className="h-[96px] w-[96px] md:h-[140px] md:w-[140px]"
        />

        <div
          className={cn(
            "w-full rounded-block bg-white/75 p-3",
            showRubric ? "max-w-[1000px]" : "max-w-[789px]"
          )}
        >
          <div className={cn("grid gap-3 sm:gap-4", showRubric ? "md:grid-cols-3" : "md:grid-cols-2")}>
            {slots.map(({ kind, doc }) => (
              <Dropzone
                key={kind}
                kind={kind}
                doc={doc}
                locked={locked}
                onPreview={onPreview ? () => onPreview(kind) : undefined}
                hint={kind === "rubric" ? "Optional" : undefined}
                onSelect={onSelect}
                onClear={() => onClear(kind)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            disabled={!ready}
            className={cn(
              "flex h-11 items-center gap-2 rounded-[64px] border-2 pl-6 pr-5 text-p4 font-medium transition-all",
              ready
                ? "border-[#FFFFFF26] bg-[#303030] text-surface shadow-[0_4px_5px_0_#0000001F] hover:bg-[#3A3A3A] active:scale-[0.98]"
                : "cursor-not-allowed border-[#FFFFFF26] bg-[#A6A4A4] text-white/60"
            )}
          >
            Start Mapping
            <Image src={RightArrow} alt="" width={20} height={20} />
          </button>

          <p className="max-w-[480px] text-center text-p5 text-subtle">{footnote}</p>
        </div>
      </div>
    </section>
  );
}
