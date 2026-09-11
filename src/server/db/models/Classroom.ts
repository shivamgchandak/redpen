import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ClassroomSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** Shown on the class card, for example "10B Biology". */
    name: { type: String, required: true, trim: true },
    school: { type: String, required: true, trim: true },
    grade: { type: String, required: true, trim: true },
    section: { type: String, default: "", trim: true },
    /** Fed into every prompt, so marking uses the right subject. */
    subject: { type: String, required: true, trim: true },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ClassroomSchema.index({ ownerId: 1, archivedAt: 1, createdAt: -1 });

export type ClassroomDoc = InferSchemaType<typeof ClassroomSchema>;

export const Classroom: Model<ClassroomDoc> =
  (models.Classroom as Model<ClassroomDoc>) ??
  model<ClassroomDoc>("Classroom", ClassroomSchema);
