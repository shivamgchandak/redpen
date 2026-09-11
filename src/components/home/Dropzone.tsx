"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/cn";
import { countPages, formatBytes } from "@/lib/pdf";
import type { DocKind, SourceDoc } from "@/lib/types";

import XCross from "../../../public/images/X.png";
import UploadButton from "../../../public/images/Upload.png";
import PDFBatch from "../../../public/images/PDFBatch.png";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "application/pdf,image/png,image/jpeg,image/webp";

export function Dropzone({
  kind,
  doc,
  onSelect,
  onClear,
  hint = "Up to 10 MB",
  disabled = false,
  locked = false,
  onPreview,
}: {
  kind: DocKind;
  hint?: string;
  disabled?: boolean;
  /** Demo: the file is fixed. It can be opened, not removed or replaced. */
  locked?: boolean;
  onPreview?: () => void;
  doc: SourceDoc | null;
  onSelect: (doc: SourceDoc, file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label =
    kind === "question" ? "Question Paper" : kind === "rubric" ? "Rubric" : "Answer Sheet";

  async function accept(file: File | undefined) {
    if (!file) return;

    setError(null);

    if (file.size > MAX_BYTES) {
      setError(`This file is ${formatBytes(file.size)}. The limit is 10 MB.`);
      return;
    }

    if (!ACCEPT.split(",").includes(file.type)) {
      setError("PDF or image files only");
      return;
    }

    const base: SourceDoc = {
      kind,
      name: file.name,
      size: file.size,
      pages: null,
      mime: file.type,
    };

    onSelect(base, file);

    try {
      const pages = await countPages(file);
      onSelect({ ...base, pages }, file);
    } catch {
    }
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!locked) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!locked) void accept(e.dataTransfer.files[0]);
        }}
        className={cn(
          "relative flex h-[181px] w-full min-w-0 items-center justify-center rounded-card bg-surface px-4 border-[1.5px] border-dashed border-[#CECECE] transition-colors",
          dragging && "bg-brand/5 ring-2 ring-brand/40"
        )}
      >
        {doc && locked ? (
          <div className="flex w-full flex-col items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              aria-label={`View the ${label.toLowerCase()}`}
              className="flex h-[60px] w-full max-w-[300px] items-center gap-3 rounded-field bg-[#f6f6f6] px-3 py-2 text-left transition-colors hover:bg-surface-dim"
            >
              <PdfBadge mime={doc.mime} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-p4 font-semibold text-ink">{doc.name}</span>
                <span className="block text-p5 text-subtle">
                  {formatBytes(doc.size)}
                  {doc.pages !== null && ` \u2022 ${doc.pages} ${doc.pages === 1 ? "Page" : "Pages"}`}
                </span>
              </span>
              <Eye className="size-4 shrink-0 text-brand" strokeWidth={2} />
            </button>
            <span className="text-p5 text-subtle">{`Sample ${label.toLowerCase()}, tap to view`}</span>
          </div>
        ) : doc ? (
          <>
            <div className="relative w-full max-w-[300px]">
              <div
                className="flex h-[55px] w-full items-center gap-3 rounded-field bg-[#f6f6f6] px-3 py-2 md:h-[60px] lg:h-[65px]"
              >
                <PdfBadge mime={doc.mime} />

                <div className="min-w-0">
                  <p className="truncate text-p4 font-semibold text-ink">
                    {doc.name}
                  </p>

                  <p className="text-p5 text-subtle">
                    {formatBytes(doc.size)}

                    {doc.pages !== null && (
                      <>
                        {" "}
                        &bull; {doc.pages}{" "}
                        {doc.pages === 1 ? "Page" : "Pages"}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClear}
                disabled={disabled}
                aria-label={`Remove ${label}`}
                className="absolute right-[-20px] top-[-16px] grid place-items-center transition-transform hover:scale-105"
              >
                <Image
                  src={XCross}
                  alt="Remove"
                  width={50}
                  height={50}
                />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            className="flex flex-col items-center gap-2 outline-none disabled:opacity-60"
          >
            <Image
              src={UploadButton}
              alt="Upload"
              width={48}
              height={48}
              className="h-[40px] w-[40px] md:h-[48px] md:w-[48px]"
            />

            <span className="text-[18px] font-bold text-ink md:text-[20px]">
              Upload <span className="text-brand">{label}</span>
            </span>

            <span className="text-[12px] text-subtle md:text-[14px]">
              {hint}
            </span>
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            void accept(e.target.files?.[0]);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-2 px-1 text-p5 text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function PdfBadge({ mime }: { mime: string }) {
  const isPdf = mime === "application/pdf";

  return isPdf ? (
    <Image
      src={PDFBatch}
      alt="PDF"
      width={35}
      height={40}
      className="h-[32px] w-[28px] shrink-0 md:h-[40px] md:w-[35px]"
    />
  ) : (
    <span
      className="grid h-[32px] w-[28px] shrink-0 place-items-center rounded-[5px] bg-slate text-[8px] font-bold text-surface md:h-[40px] md:w-[35px] md:text-[9px]"
    >
      IMG
    </span>
  );
}
