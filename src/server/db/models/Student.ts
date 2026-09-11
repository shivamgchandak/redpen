import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const StudentSchema = new Schema(
  {
    classroomId: { type: Schema.Types.ObjectId, ref: "Classroom", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

StudentSchema.index({ classroomId: 1, name: 1 });

// Roll numbers are optional, but when given they must be unique in the class.
StudentSchema.index(
  { classroomId: 1, rollNo: 1 },
  { unique: true, partialFilterExpression: { rollNo: { $type: "string", $gt: "" } } }
);

export type StudentDoc = InferSchemaType<typeof StudentSchema>;

export const Student: Model<StudentDoc> =
  (models.Student as Model<StudentDoc>) ?? model<StudentDoc>("Student", StudentSchema);
