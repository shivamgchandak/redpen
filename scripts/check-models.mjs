#!/usr/bin/env node
/**
 * Validates the model IDs this app depends on against Groq's live catalogue.
 *
 * Groq deprecates and rotates models (especially preview ones) on short
 * notice, so a model ID written into the code can break without warning. Run `npm run check:models`
 * before a deploy. It fails loudly with the current list instead of letting
 * a 404 surface as "extraction failed" in the UI.
 */

import { readFileSync } from "node:fs";

const WANTED = {
  vision: "qwen/qwen3.6-27b",
  reason: "openai/gpt-oss-120b",
  fast: "openai/gpt-oss-20b",
};

function loadKey() {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  for (const file of [".env.local", ".env"]) {
    try {
      const line = readFileSync(file, "utf8")
        .split("\n")
        .find((l) => l.startsWith("GROQ_API_KEY="));
      if (line) return line.slice("GROQ_API_KEY=".length).trim();
    } catch {
      /* next candidate */
    }
  }
  return null;
}

const key = loadKey();
if (!key) {
  console.error("GROQ_API_KEY not found. Add it to .env.local (see .env.example).");
  process.exit(1);
}

const res = await fetch("https://api.groq.com/openai/v1/models", {
  headers: { Authorization: `Bearer ${key}` },
});

if (!res.ok) {
  console.error(`Groq /models returned ${res.status}: ${await res.text()}`);
  process.exit(1);
}

const { data = [] } = await res.json();
const available = new Set(data.map((m) => m.id));

let failed = false;
console.log("\nModel check\n");
for (const [role, id] of Object.entries(WANTED)) {
  const ok = available.has(id);
  if (!ok) failed = true;
  console.log(`  ${ok ? "ok  " : "GONE"}  ${role.padEnd(7)} ${id}`);
}

if (failed) {
  console.log("\nCurrently available on this key:\n");
  for (const id of [...available].sort()) console.log(`  ${id}`);
  console.log(
    "\nUpdate src/lib/ai/models.ts (and the copy in this script) to a model from that list.\n"
  );
  process.exit(1);
}

console.log("\nAll models present.\n");
