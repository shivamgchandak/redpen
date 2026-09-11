import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    image: { type: String, default: null },
    googleId: { type: String, default: null, index: true },
    /** Asked once on first login, then prefilled when creating a class. */
    school: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema>;

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", UserSchema);
