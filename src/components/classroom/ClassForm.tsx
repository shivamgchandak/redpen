"use client";

import { useActionState, useState } from "react";
import { createClassroom, updateClassroom } from "@/app/actions/classes";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/Button";
import type { ClassroomDTO } from "@/lib/data/dto";

/** Create or edit a class. School comes prefilled from the teacher's profile. */
export function ClassForm({
  school,
  classroom,
}: {
  school: string;
  classroom?: ClassroomDTO;
}) {
  const [state, action] = useActionState(classroom ? updateClassroom : createClassroom, null);
  const [grade, setGrade] = useState(classroom?.grade ?? "");
  const [section, setSection] = useState(classroom?.section ?? "");
  const [subject, setSubject] = useState(classroom?.subject ?? "");

  const suggested = `${grade}${section} ${subject}`.trim();
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-4">
      {classroom && <input type="hidden" name="classroomId" value={classroom.id} />}

      <Field
        label="School"
        name="school"
        defaultValue={classroom?.school ?? school}
        required
        error={errors.school}
      />

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Class"
          name="grade"
          placeholder="10"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
          error={errors.grade}
        />
        <Field
          label="Section"
          name="section"
          placeholder="B (optional)"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          error={errors.section}
        />
      </div>

      <Field
        label="Subject"
        name="subject"
        placeholder="Biology"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        hint="Used when reading papers and marking, so pick the real subject."
        required
        error={errors.subject}
      />

      <Field
        label="Class name"
        name="name"
        placeholder={suggested || "10B Biology"}
        defaultValue={classroom?.name ?? ""}
        hint="Leave empty to use the suggestion."
        error={errors.name}
      />

      {state?.message && !state.ok && (
        <p role="alert" className="text-p4 text-danger">
          {state.message}
        </p>
      )}
      {state?.ok && state.message && <p className="text-p4 text-success">{state.message}</p>}

      <SubmitButton pendingLabel={classroom ? "Saving..." : "Creating..."} className="w-full">
        {classroom ? "Save class" : "Create class"}
      </SubmitButton>
    </form>
  );
}
