import { Schema } from "mongoose";

/** A file stored in the private Vercel Blob store. */
export const BlobFileSchema = new Schema(
  {
    pathname: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    contentType: { type: String, required: true },
    pages: { type: Number, default: null },
  },
  { _id: false }
);

/** Where a background run has got to. Written by workflow steps, read by polling pages. */
export const ProgressSchema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    updatedAt: { type: Date, required: true },
  },
  { _id: false }
);

/** One rendered page image (900px JPEG) stored in Blob. */
export const PageImageSchema = new Schema(
  {
    index: { type: Number, required: true },
    pathname: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false }
);
