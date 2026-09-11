"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ClassForm } from "./ClassForm";

export function CreateClassButton({
  school,
  label = "Create class",
  variant = "button",
}: {
  school: string;
  label?: string;
  /** "tile" renders a dashed card that sits at the end of the class grid. */
  variant?: "button" | "tile";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "tile" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-card border-[1.5px] border-dashed border-hairline bg-surface/60 p-5 text-muted transition-colors hover:border-brand/50 hover:bg-surface hover:text-brand"
        >
          <span className="grid size-10 place-items-center rounded-pill bg-brand/10 text-brand">
            <Plus className="size-5" strokeWidth={2.4} />
          </span>
          <span className="text-p3 font-semibold">{label}</span>
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" strokeWidth={2.4} />
          {label}
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="Create a class">
        <ClassForm school={school} />
      </Dialog>
    </>
  );
}
