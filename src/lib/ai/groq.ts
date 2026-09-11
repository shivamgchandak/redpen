import {
  MODELS,
  LIMITS,
  REASONING_EFFORT,
  VISION_MAX_IMAGES_PER_REQUEST,
  type ModelRole,
} from "./models";

const BASE = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";

type Role = "system" | "user" | "assistant";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };
export type ContentPart = TextPart | ImagePart;

export interface Message {
  role: Role;
  content: string | ContentPart[];
}

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string
  ) {
    super(message);
    this.name = "GroqError";
  }
}

function apiKey(): string {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new GroqError(
      "GROQ_API_KEY is not set. Copy .env.example to .env.local and add a key from https://console.groq.com/keys",
      0,
      ""
    );
  }
  return key;
}

const chains = new Map<string, Promise<unknown>>();
const lastCallAt = new Map<string, number>();

function paced<T>(model: string, fn: () => Promise<T>): Promise<T> {
  const minGapMs = Math.ceil(60_000 / (LIMITS[model as keyof typeof LIMITS]?.rpm ?? 30));
  const prior = chains.get(model) ?? Promise.resolve();

  const next = prior.then(async () => {
    const since = Date.now() - (lastCallAt.get(model) ?? 0);
    if (since < minGapMs) await sleep(minGapMs - since);
    lastCallAt.set(model, Date.now());
    return fn();
  });

  chains.set(model, next.catch(() => undefined));
  return next;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const calls = new Map<string, number>();

export function resetCallCount(): void {
  calls.clear();
}

export function callCount(): { total: number; byModel: Record<string, number> } {
  const byModel = Object.fromEntries(calls);
  return {
    total: [...calls.values()].reduce((a, b) => a + b, 0),
    byModel,
  };
}

export function describeCalls(): string {
  const names = Object.entries(MODELS) as [ModelRole, string][];
  return names
    .map(([role, model]) => [role, calls.get(model) ?? 0] as const)
    .filter(([, n]) => n > 0)
    .map(([role, n]) => `${role} ${n}`)
    .join(", ");
}

const MAX_RETRY_WAIT_MS = 70_000;

function describeWait(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.round(seconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (seconds >= 60) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  return "a moment";
}

export interface ChatOptions {
  role?: ModelRole;
  messages: Message[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  attempts?: number;
  reasoningEffort?: "none" | "low" | "medium" | "high";
}

export async function chat({
  role = "reason",
  messages,
  json = false,
  temperature = 0,
  maxTokens = 2048,
  attempts = 4,
  reasoningEffort,
}: ChatOptions): Promise<string> {
  const model = MODELS[role];
  const effort = reasoningEffort ?? REASONING_EFFORT[model] ?? "low";
  const budget = LIMITS[model]?.tpm ?? 8_000;

  const cap = Math.max(256, Math.min(maxTokens, Math.floor(budget * 0.55)));

  const outbound: Message[] =
    json && !messages.some((m) => JSON.stringify(m.content).toLowerCase().includes("json"))
      ? [...messages, { role: "user", content: "Reply with JSON only." }]
      : messages;

  return paced(model, async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        calls.set(model, (calls.get(model) ?? 0) + 1);

        const res = await fetch(`${BASE}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: outbound,
            temperature,
            max_completion_tokens: cap,
            reasoning_effort: effort,
            ...(json ? { response_format: { type: "json_object" } } : {}),
          }),
        });

        if (res.status === 429 || res.status >= 500) {
          const body = await res.text();
          const header = Number(res.headers.get("retry-after"));

          const fromBody = /try again in ([\d.]+)m([\d.]+)?s?|try again in ([\d.]+)s/i.exec(body);
          const seconds = Number.isFinite(header) && header > 0
            ? header
            : fromBody
              ? (Number(fromBody[1] ?? 0) * 60 + Number(fromBody[2] ?? fromBody[3] ?? 0))
              : 0;

          const waitMs = seconds > 0 ? seconds * 1000 : Math.min(2 ** attempt * 1000, 20_000);

          if (res.status === 429 && waitMs > MAX_RETRY_WAIT_MS) {
            const perDay = /per day \(TPD\)|tokens per day/i.test(body);
            throw new GroqError(
              perDay
                ? `Groq's free daily token allowance is used up. Please try again in ${describeWait(seconds)}.`
                : `Too many requests right now. Please try again in ${describeWait(seconds)}.`,
              res.status,
              body
            );
          }

          lastError = new GroqError(`Groq ${res.status} on ${model}`, res.status, body);
          if (attempt < attempts) {
            await sleep(waitMs);
            continue;
          }
          throw lastError;
        }

        if (!res.ok) {
          throw new GroqError(
            `Groq ${res.status} on ${model}`,
            res.status,
            await res.text()
          );
        }

        const data = (await res.json()) as {
          choices?: { message?: { content?: string }; finish_reason?: string }[];
        };

        if (json && data.choices?.[0]?.finish_reason === "length") {
          throw new GroqError(
            `Response from ${model} was cut off at the token limit.`,
            200,
            "finish_reason=length"
          );
        }

        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== "string") {
          throw new GroqError("Groq returned no message content", 200, JSON.stringify(data));
        }
        return content;
      } catch (err) {
        lastError = err;
        if (attempt >= attempts) break;
        await sleep(Math.min(2 ** attempt * 500, 8_000));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new GroqError("Groq request failed", 0, String(lastError));
  });
}

export async function vision({
  prompt,
  images,
  maxTokens = 1800,
}: {
  prompt: string;
  images: string[];
  maxTokens?: number;
}): Promise<string> {
  if (images.length === 0) throw new Error("vision() called with no images");
  if (images.length > VISION_MAX_IMAGES_PER_REQUEST) {
    throw new Error(
      `vision() got ${images.length} images; Groq allows ${VISION_MAX_IMAGES_PER_REQUEST} per request. Chunk the pages.`
    );
  }

  const content: ContentPart[] = [
    { type: "text", text: prompt },
    ...images.map<ImagePart>((url) => ({ type: "image_url", image_url: { url } })),
  ];

  return chat({
    role: "vision",
    messages: [{ role: "user", content }],
    maxTokens,
  });
}

export function parseJson<T>(raw: string): T {
  const trimmed = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const start = trimmed.search(/[[{]/);
    const end = Math.max(trimmed.lastIndexOf("]"), trimmed.lastIndexOf("}"));
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1)) as T;
    }
    throw new Error(`Model did not return JSON: ${trimmed.slice(0, 200)}`);
  }
}
