"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTest } from "@/app/actions/tests";
import { ExtractingState } from "@/components/extracting";
import { Dropzone } from "@/components/home";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Card } from "@/components/ui/Page";
import { uploadDocument } from "@/lib/upload/documents";
import type { SourceDoc } from "@/lib/types";
import { postJson } from "./useAutoRefresh";

export function NewTestForm({ classId, teacherId }: { classId: string; teacherId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [paper, setPaper] = useState<{ doc: SourceDoc; file: File } | null>(null);
  const [rubric, setRubric] = useState<{ doc: SourceDoc; file: File } | null>(null);
  const [phase, setPhase] = useState<"form" | "working">("form");
  const [uploadLabel, setUploadLabel] = useState<string>("Preparing");
  const [formError, setFormError] = useState<string | null>(null);

  const start = async () => {
    if (!title.trim()) return setFormError("Give the test a name, like \"Unit Test 2\".");
    if (!paper) return setFormError("Upload the question paper.");
    setFormError(null);
    setPhase("working");

    try {
      const step = (label: string) => setUploadLabel(label);
      const paperUp = await uploadDocument(teacherId, "paper", paper.file, step);
      const rubricUp = rubric ? await uploadDocument(teacherId, "rubric", rubric.file, step) : null;

      step("Saving the test");
      const created = await createTest({
        classroomId: classId,
        title: title.trim(),
        paper: paperUp.file,
        rubricFile: rubricUp?.file ?? null,
        paperPages: paperUp.pages,
        rubricPages: rubricUp?.pages ?? [],
      });
      if (!created.ok) throw new Error(created.message);

      // Reading runs in the background; the review page shows its progress.
      step("Starting to read the paper");
      await postJson(`/api/tests/${created.id}/read`).catch(() => undefined);
      router.push(`/classes/${classId}/tests/${created.id}/review`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
      setPhase("form");
    }
  };

  if (phase === "working") {
    return (
      <div className="flex min-h-[420px] flex-1 flex-col gap-3">
        <ExtractingState
          title="Uploading..."
          subtitle="Keep this tab open until the upload finishes."
          progress={{ label: uploadLabel, value: 0.05 }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-5">
        <Field
          label="Test name"
          name="title"
          placeholder="Unit Test 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-p4 font-medium text-ink">Question paper</span>
            <Dropzone
              kind="question"
              doc={paper?.doc ?? null}
              onSelect={(doc, file) => setPaper({ doc, file })}
              onClear={() => setPaper(null)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-p4 font-medium text-ink">
              Rubric <span className="font-normal text-subtle">(optional)</span>
            </span>
            <Dropzone
              kind="rubric"
              hint="Optional. Without one, RedPen drafts it for you to check."
              doc={rubric?.doc ?? null}
              onSelect={(doc, file) => setRubric({ doc, file })}
              onClear={() => setRubric(null)}
            />
          </div>
        </div>

        <p className="text-p5 text-subtle">
          Your rubric can be a marking scheme with points and marks, or a model answer key. Any question it
          does not cover gets drafted points you can edit before locking.
        </p>
      </Card>

      {formError && (
        <p role="alert" className="text-p4 text-danger">
          {formError}
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={start} className="w-full sm:w-auto">
          Read paper and rubric
        </Button>
      </div>
    </div>
  );
}
