"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Lock, Plus, Trash2, Unlock } from "lucide-react";
import { lockTest, saveRubric, unlockTest } from "@/app/actions/tests";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Page";
import { StatusChip } from "@/components/ui/StatusChip";
import { cn } from "@/lib/cn";
import { ITEMS_PER_MARK_FOR_FULL } from "@/lib/marks";
import type { TestDTO } from "@/lib/data/dto";

interface EditablePoint {
  key: string;
  text: string;
  marks: string;
  essential: boolean;
}

interface EditableQuestion {
  number: string;
  display: string;
  text: string;
  maxMarks: string;
  source: "teacher" | "generated" | null;
  edited: boolean;
  points: EditablePoint[];
}

let keySeed = 0;
const newKey = () => `p${++keySeed}`;

function toEditable(test: TestDTO): EditableQuestion[] {
  const rubric = new Map(test.rubric.map((r) => [r.questionNumber, r]));
  return test.questions.map((q) => {
    const entry = rubric.get(q.number);
    return {
      number: q.number,
      display: q.display,
      text: q.text,
      maxMarks: q.maxMarks === null ? "" : String(q.maxMarks),
      source: entry?.source ?? null,
      edited: entry?.editedByTeacher ?? false,
      points: (entry?.scheme.points ?? []).map((p) => ({
        key: newKey(),
        text: p.text,
        marks: typeof p.marks === "number" ? String(p.marks) : "",
        essential: Boolean(p.essential),
      })),
    };
  });
}

function parseMarks(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function howMarked(q: EditableQuestion): string {
  const max = parseMarks(q.maxMarks) ?? 0;
  const points = q.points.filter((p) => p.text.trim());
  if (points.length === 0) return "Add at least one point.";
  if (points.every((p) => (parseMarks(p.marks) ?? 0) > 0)) {
    const sum = points.reduce((s, p) => s + (parseMarks(p.marks) ?? 0), 0);
    return `Marked by point values: ${sum} available, capped at ${max || "the maximum"}.`;
  }
  const needed = Math.min(points.length, Math.ceil(max * ITEMS_PER_MARK_FOR_FULL));
  return `Full marks for covering ${needed || 1} of these ${points.length} points.`;
}

export function RubricEditor({ test, classId, canUnlock }: { test: TestDTO; classId: string; canUnlock: boolean }) {
  const locked = test.status === "locked";
  const [questions, setQuestions] = useState(() => toEditable(test));
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const teacherCount = useMemo(() => questions.filter((q) => q.source === "teacher").length, [questions]);
  const total = questions.reduce((s, q) => s + (parseMarks(q.maxMarks) ?? 0), 0);

  const update = (number: string, change: (q: EditableQuestion) => EditableQuestion) => {
    setQuestions((qs) => qs.map((q) => (q.number === number ? change(q) : q)));
    setDirty(true);
    setMessage(null);
  };

  const payload = () => ({
    testId: test.id,
    questions: questions.map((q) => ({
      number: q.number,
      maxMarks: parseMarks(q.maxMarks) ?? 0,
      points: q.points
        .filter((p) => p.text.trim())
        .map((p) => ({ text: p.text.trim(), marks: parseMarks(p.marks), essential: p.essential })),
    })),
  });

  const save = () =>
    startTransition(async () => {
      const res = await saveRubric(payload());
      setMessage({ ok: Boolean(res?.ok), text: res?.message ?? (res?.ok ? "Saved." : "Could not save.") });
      if (res?.ok) setDirty(false);
    });

  const lock = () =>
    startTransition(async () => {
      if (dirty) {
        const saved = await saveRubric(payload());
        if (!saved?.ok) {
          setMessage({ ok: false, text: saved?.message ?? "Could not save." });
          return;
        }
      }
      const res = await lockTest(test.id);
      if (res && !res.ok) setMessage({ ok: false, text: res.message ?? "Could not lock." });
    });

  const unlock = () =>
    startTransition(async () => {
      const res = await unlockTest(test.id);
      if (res && !res.ok) setMessage({ ok: false, text: res.message ?? "Could not unlock." });
    });

  return (
    <div className="flex flex-col gap-4 pb-24">
      {locked ? (
        <Notice tone="success">
          This rubric is locked, so every student is marked the same way.{" "}
          {canUnlock ? "No scripts are marked yet, so you can still unlock it." : "Scripts have been marked with it, so it stays locked."}
        </Notice>
      ) : (
        <Notice>
          Check the marks and points for each question. {teacherCount > 0 ? `${teacherCount} of ${questions.length} come from your rubric. ` : ""}
          When it looks right, lock it and start marking.
        </Notice>
      )}

      {test.warnings.map((w) => (
        <Notice key={w} tone="warn">
          {w}
        </Notice>
      ))}

      <ol className="flex flex-col gap-3">
        {questions.map((q) => (
          <li key={q.number} className="flex flex-col gap-3 rounded-card bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-chip bg-[#2B2B2B] px-2 text-p5 font-bold text-white">
                  {q.display}
                </span>
                <p className="min-w-0 flex-1 text-p4 leading-relaxed text-ink">{q.text}</p>
              </div>
              <div className="flex items-center gap-2">
                {q.source && (
                  <StatusChip tone={q.source === "teacher" ? "success" : "brand"}>
                    {q.source === "teacher" ? "Your rubric" : "Drafted by RedPen"}
                    {q.edited ? ", edited" : ""}
                  </StatusChip>
                )}
                <label className="flex items-center gap-1.5 text-p5 text-muted">
                  Marks
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={q.maxMarks}
                    disabled={locked}
                    onChange={(e) => update(q.number, (x) => ({ ...x, maxMarks: e.target.value }))}
                    className={cn(
                      "h-9 w-16 rounded-field border px-2 text-p4 tabular-nums text-ink disabled:bg-surface-soft",
                      q.maxMarks ? "border-hairline" : "border-danger"
                    )}
                  />
                </label>
              </div>
            </div>

            <ul className="flex flex-col gap-2">
              {q.points.map((p, i) => (
                <li key={p.key} className="flex flex-col gap-2 rounded-panel bg-surface-soft p-2.5 sm:flex-row sm:items-start">
                  <span className="hidden w-5 pt-2 text-p5 tabular-nums text-subtle sm:block">{i + 1}.</span>
                  <textarea
                    value={p.text}
                    disabled={locked}
                    rows={1}
                    onChange={(e) =>
                      update(q.number, (x) => ({
                        ...x,
                        points: x.points.map((y) => (y.key === p.key ? { ...y, text: e.target.value } : y)),
                      }))
                    }
                    className="min-h-9 min-w-0 flex-1 resize-y rounded-field border border-hairline bg-surface px-2.5 py-1.5 text-p4 text-ink disabled:border-transparent disabled:bg-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="0"
                      aria-label="Marks for this point"
                      title="Marks for this point (optional)"
                      value={p.marks}
                      disabled={locked}
                      onChange={(e) =>
                        update(q.number, (x) => ({
                          ...x,
                          points: x.points.map((y) => (y.key === p.key ? { ...y, marks: e.target.value } : y)),
                        }))
                      }
                      className="h-9 w-16 rounded-field border border-hairline bg-surface px-2 text-p4 tabular-nums disabled:border-transparent disabled:bg-transparent"
                    />
                    <label className="flex items-center gap-1 whitespace-nowrap text-p5 text-muted" title="An answer without this point cannot get full marks">
                      <input
                        type="checkbox"
                        checked={p.essential}
                        disabled={locked}
                        onChange={(e) =>
                          update(q.number, (x) => ({
                            ...x,
                            points: x.points.map((y) => (y.key === p.key ? { ...y, essential: e.target.checked } : y)),
                          }))
                        }
                        className="accent-[var(--color-brand)]"
                      />
                      Must have
                    </label>
                    {!locked && (
                      <button
                        type="button"
                        aria-label="Remove point"
                        onClick={() => update(q.number, (x) => ({ ...x, points: x.points.filter((y) => y.key !== p.key) }))}
                        className="grid size-9 place-items-center rounded-pill text-muted hover:bg-danger/5 hover:text-danger"
                      >
                        <Trash2 className="size-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-p5 text-subtle">{howMarked(q)}</p>
              {!locked && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    update(q.number, (x) => ({
                      ...x,
                      points: [...x.points, { key: newKey(), text: "", marks: "", essential: false }],
                    }))
                  }
                >
                  <Plus className="size-4" /> Add point
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-card border border-hairline/60 bg-surface/95 p-3 shadow-[0_12px_32px_rgba(24,24,24,0.12)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-p4 text-muted">
          {questions.length} questions · <span className="font-semibold text-ink">{total} marks</span>
          {message && (
            <span className={cn("ml-2", message.ok ? "text-success" : "text-danger")}>{message.text}</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          {locked ? (
            <>
              {canUnlock && (
                <Button variant="outline" size="sm" onClick={unlock} disabled={pending}>
                  <Unlock className="size-4" /> Unlock to edit
                </Button>
              )}
              <ButtonLink size="sm" href={`/classes/${classId}/tests/${test.id}`}>
                Go to marking
              </ButtonLink>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={save} disabled={pending || !dirty}>
                {pending ? "Saving..." : "Save changes"}
              </Button>
              <Button size="sm" onClick={lock} disabled={pending}>
                <Lock className="size-4" /> Lock rubric and start marking
              </Button>
            </>
          )}
        </div>
      </div>

      {!locked && (
        <p className="text-center text-p5 text-subtle">
          Wrong paper? <Link href={`/classes/${classId}`} className="text-brand hover:underline">Go back to the class</Link> and create the test again.
        </p>
      )}
    </div>
  );
}
