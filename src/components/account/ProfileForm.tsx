"use client";

import { useActionState } from "react";
import { saveProfile } from "@/app/actions/profile";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Button";

export function ProfileForm({
  name,
  school,
  next,
  submitLabel,
}: {
  name: string;
  school: string;
  next: "classes" | "stay";
  submitLabel: string;
}) {
  const [state, action] = useActionState(saveProfile, null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field
        label="Your name"
        name="name"
        defaultValue={name}
        autoComplete="name"
        required
        error={state?.fieldErrors?.name}
      />
      <Field
        label="School name"
        name="school"
        defaultValue={school}
        placeholder="Somaiya Vidyamandir"
        hint="Filled in for you whenever you create a class."
        required
        error={state?.fieldErrors?.school}
      />

      {state?.message && !state.fieldErrors && (
        <p
          role="status"
          className={state.ok ? "text-p4 text-success" : "text-p4 text-danger"}
        >
          {state.message}
        </p>
      )}

      <SubmitButton className="w-full sm:w-auto sm:self-start">{submitLabel}</SubmitButton>
    </form>
  );
}
