import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { connectDB, hasDatabase } from "@/server/db/connect";
import { StageCache } from "@/server/db/models/StageCache";

export const STAGE_VERSION = {
  questions: "2",
  answers: "3",
  rubric: "2",
  grading: "6",
  summary: "2",
  teacherRubric: "2",
} as const;

export type CacheStage = keyof typeof STAGE_VERSION;

export const PIPELINE_VERSION = Object.entries(STAGE_VERSION)
  .map(([stage, v]) => `${stage}${v}`)
  .join(".");

export function hashOf(parts: unknown[]): string {
  const h = createHash("sha256");
  for (const part of parts) {
    h.update(typeof part === "string" ? part : (JSON.stringify(part) ?? "null"));
    h.update(" ");
  }
  return h.digest("hex").slice(0, 24);
}

const MAX_MEMORY_ENTRIES = 400;
const memory = new Map<string, unknown>();

function remember(key: string, value: unknown) {
  memory.delete(key);
  memory.set(key, value);
  while (memory.size > MAX_MEMORY_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest === undefined) break;
    memory.delete(oldest);
  }
}

const DISK_ENABLED = process.env.REDPEN_CACHE_DISK !== "0";

const DISK_DIR =
  process.env.REDPEN_CACHE_DIR ??
  (process.env.NODE_ENV === "production"
    ? "/tmp/redpen-cache"
    : path.join(process.cwd(), ".cache", "pipeline"));

let diskReady: Promise<boolean> | null = null;

async function ensureDisk(): Promise<boolean> {
  if (!DISK_ENABLED) return false;
  diskReady ??= mkdir(DISK_DIR, { recursive: true }).then(
    () => true,
    () => false
  );
  return diskReady;
}

async function readDisk<T>(
  key: string
): Promise<{ hit: true; value: T } | { hit: false }> {
  if (!(await ensureDisk())) return { hit: false };
  try {
    const raw = await readFile(path.join(DISK_DIR, `${key}.json`), "utf8");
    return { hit: true, value: JSON.parse(raw) as T };
  } catch {
    return { hit: false };
  }
}

async function writeDisk(key: string, value: unknown): Promise<void> {
  if (!(await ensureDisk())) return;
  try {
    await writeFile(
      path.join(DISK_DIR, `${key}.json`),
      JSON.stringify(value),
      "utf8"
    );
  } catch {
  }
}

/**
 * The durable layer behind the memory map. With MONGODB_URI set (always
 * on Vercel, whose disk is wiped between invocations) results go to the
 * StageCache collection, so a failed or retried script resumes where it
 * stopped. Without it, local runs keep using the disk cache as before.
 */
async function readPersistent<T>(
  key: string
): Promise<{ hit: true; value: T } | { hit: false }> {
  if (!hasDatabase()) return readDisk<T>(key);
  try {
    await connectDB();
    const doc = await StageCache.findById(key).lean();
    return doc ? { hit: true, value: JSON.parse(doc.json) as T } : { hit: false };
  } catch {
    return { hit: false };
  }
}

async function writePersistent(key: string, stage: CacheStage, value: unknown): Promise<void> {
  if (!hasDatabase()) return writeDisk(key, value);
  try {
    await connectDB();
    await StageCache.updateOne(
      { _id: key },
      { $set: { stage, json: JSON.stringify(value), createdAt: new Date() } },
      { upsert: true }
    );
  } catch {
  }
}

function worthStoring(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

export interface CacheStats {
  hits: number;
  misses: number;
}

const stats: CacheStats = { hits: 0, misses: 0 };

export function cacheStats(): CacheStats {
  return { ...stats };
}

export function resetCacheStats(): void {
  stats.hits = 0;
  stats.misses = 0;
}

export async function cached<T>(
  stage: CacheStage,
  inputs: unknown[],
  produce: () => Promise<T>
): Promise<T> {
  const key = `${stage}-${STAGE_VERSION[stage]}-${hashOf(inputs)}`;

  if (memory.has(key)) {
    stats.hits++;
    return memory.get(key) as T;
  }

  const onDisk = await readPersistent<T>(key);
  if (onDisk.hit) {
    stats.hits++;
    remember(key, onDisk.value);
    return onDisk.value;
  }

  stats.misses++;
  const value = await produce();
  if (worthStoring(value)) {
    remember(key, value);
    await writePersistent(key, stage, value);
  }
  return value;
}

export async function peek<T>(
  stage: CacheStage,
  inputs: unknown[]
): Promise<T | undefined> {
  const key = `${stage}-${STAGE_VERSION[stage]}-${hashOf(inputs)}`;

  if (memory.has(key)) {
    stats.hits++;
    return memory.get(key) as T;
  }

  const onDisk = await readPersistent<T>(key);
  if (onDisk.hit) {
    stats.hits++;
    remember(key, onDisk.value);
    return onDisk.value;
  }

  stats.misses++;
  return undefined;
}

export async function store(
  stage: CacheStage,
  inputs: unknown[],
  value: unknown
): Promise<void> {
  if (!worthStoring(value)) return;
  const key = `${stage}-${STAGE_VERSION[stage]}-${hashOf(inputs)}`;
  remember(key, value);
  await writePersistent(key, stage, value);
}
