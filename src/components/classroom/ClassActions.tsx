"use client";

import { useState, useTransition } from "react";
import { Archive, Pencil } from "lucide-react";
import { archiveClassroom } from "@/app/actions/classes";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { ClassroomDTO } from "@/lib/data/dto";
import { ClassForm } from "./ClassForm";

export function ClassActions({ classroom }: { classroom: ClassroomDTO }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="size-3.5" strokeWidth={2} />
        Edit class
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Archive ${classroom.name}? It disappears from your list. Tests and marks are kept.`)) return;
          startTransition(() => archiveClassroom(classroom.id));
        }}
      >
        <Archive className="size-3.5" strokeWidth={2} />
        {pending ? "Archiving..." : "Archive"}
      </Button>

      <Dialog open={editing} onClose={() => setEditing(false)} title="Edit class">
        <ClassForm school={classroom.school} classroom={classroom} />
      </Dialog>
    </>
  );
}
