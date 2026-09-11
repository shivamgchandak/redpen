"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTest } from "@/app/actions/tests";
import { Button } from "@/components/ui/Button";

export function DeleteTestButton({ testId, title }: { testId: string; title: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Delete "${title}" and every mark in it? This cannot be undone.`)) return;
        startTransition(() => deleteTest(testId));
      }}
    >
      <Trash2 className="size-4" strokeWidth={1.8} />
      {pending ? "Deleting..." : "Delete test"}
    </Button>
  );
}
