"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, FileText, Gauge, RotateCcw, Search, Upload } from "lucide-react";
import { buttonClass } from "@/components/ui/Button";
import { Card } from "@/components/ui/Page";
import { StatusChip, SUBMISSION_STATUS } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import { formatMark } from "@/lib/marks";
import { ACCEPTED_FILES, checkFile } from "@/lib/upload/documents";
import type { StudentDTO, SubmissionRowDTO } from "@/lib/data/dto";
import { Avatar } from "./Avatar";
import { isStale, useAutoRefresh } from "./useAutoRefresh";
import { useMarkSubmission } from "./useMarkSubmission";

const RUNNING = new Set(["queued", "reading", "mapping", "grading"]);

export function TestOverview({
  classId,
  testId,
  teacherId,
  students,
  rows,
  maxTotal,
  focusStudentId,
}: {
  classId: string;
  testId: string;
  teacherId: string;
  students: StudentDTO[];
  rows: SubmissionRowDTO[];
  maxTotal: number;
  focusStudentId: string | null;
}) {
  const router = useRouter();
  const marker = useMarkSubmission(teacherId, testId);
  const [query, setQuery] = useState("");
  const byStudent = useMemo(() => new Map(rows.map((r) => [r.studentId, r])), [rows]);
  const resultHref = (studentId: string) => `/classes/${classId}/tests/${testId}/students/${studentId}`;

  const running = rows.filter((r) => RUNNING.has(r.status) && !isStale(r.progress?.updatedAt));
  const marked = rows.filter((r) => r.status === "done" || r.status === "needs_review");
  const average = marked.length > 0 ? marked.reduce((s, r) => s + (r.total ?? 0), 0) / marked.length : null;
  const toReview = rows.filter((r) => r.status === "needs_review").length;
  const uploading = marker.uploadingId !== null;

  useAutoRefresh(running.length > 0, 3000);

  // Only the upload needs the tab; marking carries on without it.
  useEffect(() => {
    if (!uploading) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [uploading]);

  const focusRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    focusRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  const visible = students.filter((s) => {
    const q = query.trim().toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
  });

  const onFile = async (studentId: string, file: File | undefined) => {
    if (!file) return;
    const problem = checkFile(file);
    if (problem) return window.alert(problem);
    const outcome = await marker.upload(studentId, file);
    if (outcome === "kept") router.push(`${resultHref(studentId)}?kept=1`);
    else router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<CheckCircle2 className="size-4" />} label="Marked" value={`${marked.length}`} suffix={`of ${students.length}`} />
        <Stat
          icon={<Gauge className="size-4" />}
          label="Class average"
          value={average === null ? "0" : formatMark(Math.round(average * 2) / 2)}
          suffix={`of ${maxTotal}`}
        />
        <Stat
          icon={<AlertTriangle className="size-4" />}
          label="Needs review"
          value={String(toReview)}
          tone={toReview > 0 ? "warn" : undefined}
        />
        <a
          href={`/api/tests/${testId}/export`}
          download
          className="group flex flex-col justify-between gap-2 rounded-card border border-transparent bg-surface p-4 transition-colors hover:border-brand/40"
        >
          <span className="grid size-8 place-items-center rounded-field bg-brand/10 text-brand">
            <Download className="size-4" />
          </span>
          <span className="text-p4 font-semibold text-ink group-hover:text-brand">Download marksheet</span>
        </a>
      </div>

      {running.length > 0 && (
        <p className="flex items-center gap-2 rounded-panel border border-brand/20 bg-surface px-4 py-2.5 text-p4 text-ink">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />
            <span className="relative inline-flex size-2.5 rounded-full bg-brand" />
          </span>
          Marking {running.length} {running.length === 1 ? "sheet" : "sheets"} in the background. You can leave this page.
        </p>
      )}

      {students.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-p2 font-bold text-ink">No students in this class yet</p>
          <p className="text-p4 text-muted">Add your students, then upload each one&apos;s answer sheet here.</p>
          <Link href={`/classes/${classId}?tab=students`} className={buttonClass("primary", "sm", "mt-2")}>
            Add students
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 sm:p-0">
          <div className="flex flex-col gap-2 border-b border-hairline/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-p5 text-subtle">
              Upload a PDF or photo for each student. The upload takes a few seconds; marking then runs in the background.
            </p>
            {students.length > 8 && (
              <label className="flex h-9 items-center gap-2 rounded-pill border border-hairline px-3 sm:w-56">
                <Search className="size-4 text-subtle" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a student"
                  className="min-w-0 flex-1 bg-transparent text-p4 outline-none placeholder:text-subtle"
                />
              </label>
            )}
          </div>

          <ul className="divide-y divide-hairline/60">
            {visible.map((s) => {
              const row = byStudent.get(s.id);
              const isUploading = marker.uploadingId === s.id;
              const isRunning = Boolean(row && RUNNING.has(row.status) && !isStale(row.progress?.updatedAt));
              const isStuck = Boolean(row && RUNNING.has(row.status) && !isRunning);
              const isMarked = Boolean(row && (row.status === "done" || row.status === "needs_review"));
              const canMark = Boolean(row && (row.status === "uploaded" || row.status === "failed" || isStuck));
              const status = row ? SUBMISSION_STATUS[row.status] : null;
              const failedHere = marker.error?.studentId === s.id ? marker.error.message : null;
              const errorText = failedHere ?? (row?.status === "failed" ? row.error : isStuck ? "Marking seems to have stopped. Mark it again." : null);

              return (
                <li
                  key={s.id}
                  ref={s.id === focusStudentId ? focusRef : undefined}
                  className={cn("flex flex-col gap-2 px-4 py-3 transition-colors", s.id === focusStudentId && "bg-brand/5")}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Avatar name={s.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-p3 font-medium text-ink">{s.name}</p>
                      <p className="text-p5 text-subtle">{s.rollNo ? `Roll number ${s.rollNo}` : "No roll number"}</p>
                    </div>

                    {isMarked && row && (
                      <span className="text-p2 font-bold tabular-nums text-ink">
                        {formatMark(row.total ?? 0)}
                        <span className="text-p5 font-normal text-subtle"> / {row.maxTotal ?? maxTotal}</span>
                      </span>
                    )}

                    {isUploading ? (
                      <StatusChip tone="brand">Uploading</StatusChip>
                    ) : status ? (
                      <StatusChip tone={isStuck ? "danger" : status.tone}>
                        {isStuck
                          ? "Stopped"
                          : row?.status === "needs_review" && row.reviewCount > 0
                            ? `${row.reviewCount} to review`
                            : status.label}
                      </StatusChip>
                    ) : (
                      <StatusChip>No sheet</StatusChip>
                    )}

                    <div className="flex w-full items-center gap-2 sm:w-auto">
                      {isMarked && (
                        <Link href={resultHref(s.id)} className={buttonClass("dark", "sm", "flex-1 sm:flex-none")}>
                          <FileText className="size-4" /> View
                        </Link>
                      )}
                      {canMark && row && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (await marker.markAgain(s.id, row.id)) router.refresh();
                          }}
                          className={buttonClass("dark", "sm", "flex-1 sm:flex-none")}
                        >
                          <RotateCcw className="size-4" /> Mark now
                        </button>
                      )}
                      {!isRunning && (
                        <label
                          className={cn(
                            buttonClass(row ? "outline" : "primary", "sm", "flex-1 cursor-pointer sm:flex-none"),
                            uploading && "pointer-events-none opacity-60"
                          )}
                        >
                          <Upload className="size-4" />
                          {row ? "Replace" : "Upload sheet"}
                          <input
                            type="file"
                            accept={ACCEPTED_FILES}
                            className="sr-only"
                            disabled={uploading}
                            onChange={(e) => {
                              void onFile(s.id, e.target.files?.[0]);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {(isUploading || isRunning) && (
                    <ProgressLine
                      label={isUploading ? marker.uploadLabel ?? "Uploading" : row?.progress?.label ?? "Queued"}
                      value={isUploading ? 0.04 : row?.progress?.value ?? 0.02}
                      note={isUploading ? "Keep this tab open until the upload finishes." : undefined}
                    />
                  )}
                  {errorText && <p className="text-p5 text-danger">{errorText}</p>}
                </li>
              );
            })}
            {visible.length === 0 && (
              <li className="px-4 py-8 text-center text-p4 text-muted">No student matches &quot;{query}&quot;.</li>
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}

function ProgressLine({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="flex flex-col gap-1 pl-12">
      <div
        className="h-1.5 w-full overflow-hidden rounded-pill bg-surface-dim"
        role="progressbar"
        aria-valuenow={Math.round(value * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-pill bg-brand-gradient transition-[width] duration-700"
          style={{ width: `${Math.max(4, value * 100)}%` }}
        />
      </div>
      <p className="text-p5 text-muted">
        {label}
        {note ? <span className="text-subtle"> · {note}</span> : null}
      </p>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  suffix,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  tone?: "warn";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card bg-surface p-4">
      <span
        className={cn(
          "grid size-8 place-items-center rounded-field",
          tone === "warn" ? "bg-warn/10 text-warn" : "bg-surface-soft text-muted"
        )}
      >
        {icon}
      </span>
      <div>
        <p className={cn("text-[22px] font-bold leading-none tabular-nums", tone === "warn" ? "text-warn" : "text-ink")}>
          {value}
          {suffix && <span className="ml-1 text-p5 font-normal text-subtle">{suffix}</span>}
        </p>
        <p className="mt-1 text-[11px] uppercase tracking-wide text-subtle">{label}</p>
      </div>
    </div>
  );
}
