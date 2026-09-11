"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { addStudents, removeStudent, updateStudent } from "@/app/actions/students";
import { SubmitButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Page";
import type { StudentDTO } from "@/lib/data/dto";

export function StudentsPanel({ classId, students }: { classId: string; students: StudentDTO[] }) {
  const [state, action] = useActionState(addStudents, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="flex h-fit flex-col gap-3">
        <h2 className="text-p2 font-bold text-ink">Add students</h2>
        <form ref={formRef} action={action} className="flex flex-col gap-3">
          <input type="hidden" name="classroomId" value={classId} />
          <label className="flex flex-col gap-1.5">
            <span className="text-p5 text-subtle">
              One student per line. Put the roll number first if you like, or paste two columns from a spreadsheet.
            </span>
            <textarea
              name="roster"
              rows={7}
              placeholder={"1, Aarav Mehta\n2, Diya Patel\n3, Kabir Singh"}
              className="w-full resize-y rounded-field border border-hairline bg-surface px-3 py-2 text-p4 text-ink outline-none placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/15"
              required
            />
          </label>
          {state?.message && (
            <p role="status" className={state.ok ? "text-p5 text-success" : "text-p5 text-danger"}>
              {state.message}
            </p>
          )}
          <SubmitButton size="sm" pendingLabel="Adding...">
            Add to class
          </SubmitButton>
        </form>
      </Card>

      <Card className="p-0 sm:p-0">
        {students.length === 0 ? (
          <p className="px-5 py-10 text-center text-p4 text-muted">
            No students yet. Add them on the left, then you can upload each one&apos;s answer sheet.
          </p>
        ) : (
          <ul className="divide-y divide-hairline/60">
            {students.map((s) => (
              <StudentRow key={s.id} student={s} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StudentRow({ student }: { student: StudentDTO }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(student.name);
  const [rollNo, setRollNo] = useState(student.rollNo);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const res = await updateStudent({ studentId: student.id, name, rollNo });
      if (res?.ok) {
        setEditing(false);
        setError(null);
      } else setError(res?.message ?? "Could not save.");
    });

  const remove = () => {
    if (!window.confirm(`Remove ${student.name}? Their marked answer sheets are deleted too.`)) return;
    startTransition(async () => {
      const res = await removeStudent(student.id);
      if (!res?.ok) setError(res?.message ?? "Could not remove.");
    });
  };

  if (editing) {
    return (
      <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <input
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="Roll"
          aria-label="Roll number"
          className="h-9 w-full rounded-field border border-hairline px-2 text-p4 sm:w-20"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
          className="h-9 min-w-0 flex-1 rounded-field border border-hairline px-2 text-p4"
        />
        <div className="flex gap-1">
          <button type="button" onClick={save} disabled={pending} aria-label="Save" className="grid size-9 place-items-center rounded-pill text-success hover:bg-success/10">
            <Check className="size-4" />
          </button>
          <button type="button" onClick={() => setEditing(false)} aria-label="Cancel" className="grid size-9 place-items-center rounded-pill text-muted hover:bg-surface-soft">
            <X className="size-4" />
          </button>
        </div>
        {error && <p className="text-p5 text-danger">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="w-12 shrink-0 text-p4 tabular-nums text-subtle">{student.rollNo || "-"}</span>
      <span className="min-w-0 flex-1 truncate text-p3 text-ink">{student.name}</span>
      {error && <span className="text-p5 text-danger">{error}</span>}
      <button type="button" onClick={() => setEditing(true)} aria-label={`Edit ${student.name}`} className="grid size-9 place-items-center rounded-pill text-muted hover:bg-surface-soft hover:text-ink">
        <Pencil className="size-4" strokeWidth={1.8} />
      </button>
      <button type="button" onClick={remove} disabled={pending} aria-label={`Remove ${student.name}`} className="grid size-9 place-items-center rounded-pill text-muted hover:bg-danger/5 hover:text-danger">
        <Trash2 className="size-4" strokeWidth={1.8} />
      </button>
    </li>
  );
}
