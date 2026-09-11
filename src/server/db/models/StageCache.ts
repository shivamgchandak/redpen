import { Schema, model, models, type Model } from "mongoose";

/**
 * Pipeline stage results, keyed by a hash of each stage's inputs
 * (see lib/cache.ts). Stored as a JSON string so model output with any
 * key names comes back unchanged. Entries expire after 60 days to keep
 * the free Atlas cluster small.
 */
export interface StageCacheDoc {
  _id: string;
  stage: string;
  json: string;
  createdAt: Date;
}

const StageCacheSchema = new Schema<StageCacheDoc>(
  {
    _id: { type: String, required: true },
    stage: { type: String, required: true },
    json: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 60 },
  },
  { versionKey: false }
);

export const StageCache: Model<StageCacheDoc> =
  (models.StageCache as Model<StageCacheDoc>) ??
  model<StageCacheDoc>("StageCache", StageCacheSchema);
