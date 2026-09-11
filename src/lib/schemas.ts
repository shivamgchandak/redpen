import { z } from "zod";

/**
 * Input shapes shared by the browser and the server. Server actions validate
 * with these, and the client builds its payloads to the same types.
 */

export const Sha256 = z.string().regex(/^[a-f0-9]{64}$/);

export const BlobFileInput = z.object({
  pathname: z.string().min(1),
  name: z.string().min(1).max(200),
  size: z.number().int().positive(),
  contentType: z.string().min(1),
  pages: z.number().int().positive().nullable(),
});

export const PageImageInput = z.object({
  index: z.number().int().nonnegative(),
  pathname: z.string().min(1),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const LineBoxInput = z.object({
  index: z.number().int().nonnegative(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const AnswerPageInput = PageImageInput.extend({
  annotatedPathname: z.string().min(1),
  lines: z.array(LineBoxInput),
});

export const CreateTestInput = z.object({
  classroomId: z.string(),
  title: z.string().trim().min(1, "Give the test a name").max(100),
  paper: BlobFileInput,
  rubricFile: BlobFileInput.nullable(),
  paperPages: z.array(PageImageInput).min(1).max(12),
  rubricPages: z.array(PageImageInput).max(12),
});

export const RubricPointInput = z.object({
  text: z.string().trim().min(1).max(400),
  marks: z.number().min(0).max(100).nullable(),
  essential: z.boolean(),
});

export const RubricEditInput = z.object({
  testId: z.string(),
  questions: z.array(
    z.object({
      number: z.string(),
      maxMarks: z.number().min(0.5).max(100),
      points: z.array(RubricPointInput).max(40),
    })
  ),
});

export const SameSheetInput = z.object({
  testId: z.string(),
  studentId: z.string(),
  sourceHash: Sha256,
});

export const AnswerSheetInput = SameSheetInput.extend({
  sourceFile: BlobFileInput,
  pages: z.array(AnswerPageInput).min(1).max(20),
});

export const OverrideInput = z.object({
  submissionId: z.string(),
  questionNumber: z.string(),
  score: z.number().min(0).max(100).nullable(),
  note: z.string().trim().max(200).optional(),
});

export type CreateTestInput = z.infer<typeof CreateTestInput>;
export type RubricEditInput = z.infer<typeof RubricEditInput>;
export type AnswerSheetInput = z.infer<typeof AnswerSheetInput>;
export type OverrideInput = z.infer<typeof OverrideInput>;
