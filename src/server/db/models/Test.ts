import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { BlobFileSchema, PageImageSchema, ProgressSchema } from "./shared";

/** Mirrors the Question type in lib/types.ts. */
const QuestionSchema = new Schema(
  {
    number: { type: String, required: true },
    display: { type: String, required: true },
    printedOrder: { type: Number, required: true },
    text: { type: String, required: true },
    maxMarks: { type: Number, default: null },
    parent: { type: String, default: null },
    group: { type: String, default: null },
    chooseCount: { type: Number, default: null },
  },
  { _id: false }
);

/** The marking scheme for one question, from the teacher's rubric or generated. */
const RubricEntrySchema = new Schema(
  {
    questionNumber: { type: String, required: true },
    source: { type: String, enum: ["teacher", "generated"], required: true },
    /** A MarkScheme from lib/marks.ts. */
    scheme: { type: Schema.Types.Mixed, required: true },
    editedByTeacher: { type: Boolean, default: false },
  },
  { _id: false }
);

const TestSchema = new Schema(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    /**
     * draft     files uploaded, not read yet
     * reading   question paper and rubric being read
     * review    teacher is checking questions and rubric
     * locked    rubric frozen, scripts can be marked
     * failed    reading failed, see `error`
     */
    status: {
      type: String,
      enum: ["draft", "reading", "review", "locked", "failed"],
      default: "draft",
    },
    paper: { type: BlobFileSchema, required: true },
    rubricFile: { type: BlobFileSchema, default: null },
    paperPages: { type: [PageImageSchema], default: [] },
    rubricPages: { type: [PageImageSchema], default: [] },
    questions: { type: [QuestionSchema], default: [] },
    rubric: { type: [RubricEntrySchema], default: [] },
    /** What the paper looks like to the model, to catch a paper in the wrong class. */
    detectedSubject: { type: String, default: null },
    warnings: { type: [String], default: [] },
    error: { type: String, default: null },
    /** Background reading: progress for the page to poll, and the workflow run. */
    progress: { type: ProgressSchema, default: null },
    runId: { type: String, default: null },
    lockedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

TestSchema.index({ classroomId: 1, createdAt: -1 });

export type TestDoc = InferSchemaType<typeof TestSchema>;

export const Test: Model<TestDoc> =
  (models.Test as Model<TestDoc>) ?? model<TestDoc>("Test", TestSchema);
