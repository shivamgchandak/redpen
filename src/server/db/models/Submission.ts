import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { BlobFileSchema, PageImageSchema, ProgressSchema } from "./shared";

/** Mirrors the Grade type in lib/types.ts, plus the teacher's override. */
const GradeSchema = new Schema(
  {
    questionNumber: { type: String, required: true },
    score: { type: Number, default: null },
    maxMarks: { type: Number, default: null },
    verdict: {
      type: String,
      enum: ["correct", "partial", "incorrect", "unattempted"],
      required: true,
    },
    feedback: { type: String, default: "" },
    counted: { type: Boolean, default: true },
    needsReview: { type: Boolean, default: false },
    reviewNote: { type: String, default: null },
    overrideScore: { type: Number, default: null },
    overrideNote: { type: String, default: null },
  },
  { _id: false }
);

const AnswerPageSchema = PageImageSchema.clone();
AnswerPageSchema.add({
  /** The same page with line numbers stamped in the margin, for the vision model. */
  annotatedPathname: { type: String, required: true },
  lines: { type: Schema.Types.Mixed, default: [] },
});

const SubmissionSchema = new Schema(
  {
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true },
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["uploaded", "queued", "reading", "mapping", "grading", "done", "needs_review", "failed"],
      default: "uploaded",
    },
    sourceFile: { type: BlobFileSchema, required: true },
    /** SHA-256 of the uploaded file. The same file again is never marked again. */
    sourceHash: { type: String, default: null },
    pages: { type: [AnswerPageSchema], default: [] },
    /** AnswerBlock[], Mapping[] and Summary from lib/types.ts. */
    answers: { type: Schema.Types.Mixed, default: [] },
    mappings: { type: Schema.Types.Mixed, default: [] },
    unmatchedAnswerIds: { type: [String], default: [] },
    /** Background marking: progress for the page to poll, and the workflow run. */
    progress: { type: ProgressSchema, default: null },
    runId: { type: String, default: null },
    queuedAt: { type: Date, default: null },
    grades: { type: [GradeSchema], default: [] },
    summary: { type: Schema.Types.Mixed, default: null },
    total: { type: Number, default: null },
    maxTotal: { type: Number, default: null },
    warnings: { type: [String], default: [] },
    error: { type: String, default: null },
    elapsedMs: { type: Number, default: null },
    markedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One answer sheet per student per test; uploading again replaces it.
SubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export type SubmissionDoc = InferSchemaType<typeof SubmissionSchema>;

export const Submission: Model<SubmissionDoc> =
  (models.Submission as Model<SubmissionDoc>) ??
  model<SubmissionDoc>("Submission", SubmissionSchema);
