export const MODELS = {
  vision: "qwen/qwen3.6-27b",
  reason: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
} as const;

export type ModelRole = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelRole];

export const LIMITS: Record<ModelId, { rpm: number; tpm: number; rpd: number }> = {
  "qwen/qwen3.6-27b": { rpm: 30, tpm: 8_000, rpd: 1_000 },
  "openai/gpt-oss-120b": { rpm: 30, tpm: 8_000, rpd: 1_000 },
  "openai/gpt-oss-20b": { rpm: 30, tpm: 8_000, rpd: 1_000 },
};

export const REASONING_EFFORT: Record<ModelId, "none" | "low" | "medium" | "high"> = {
  "qwen/qwen3.6-27b": "none",
  "openai/gpt-oss-120b": "low",
  "openai/gpt-oss-20b": "low",
};

export const VISION_MAX_IMAGES_PER_REQUEST = 5;
export const VISION_MAX_BYTES_PER_REQUEST = 20 * 1024 * 1024;

export const TOKENS_PER_PAGE_IMAGE = 1_800;
export const VISION_MAX_PAGES_PER_REQUEST = 3;

export const VISION_MAX_ANSWER_PAGES_PER_REQUEST = 2;
export const TOKENS_PER_ANSWER_PAGE_OUT = 850;

export function pagesPerMinute(): number {
  return Math.floor(LIMITS[MODELS.vision].tpm / TOKENS_PER_PAGE_IMAGE);
}
