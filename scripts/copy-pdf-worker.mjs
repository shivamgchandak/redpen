#!/usr/bin/env node
/**
 * Copies the pdf.js worker out of node_modules into public/.
 *
 * pdf.js refuses to run when the worker file and the library disagree on
 * version ("The API version X does not match the Worker version Y"), and a
 * worker copied by hand goes stale the moment the dependency moves. Running this
 * on postinstall means the two can never drift, on a laptop or on Vercel.
 */

import { copyFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const from = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const to = join(root, "public", "pdf.worker.min.mjs");

if (!existsSync(from)) {
  console.warn("[pdf-worker] pdfjs-dist not installed yet, skipping.");
  process.exit(0);
}

mkdirSync(join(root, "public"), { recursive: true });
copyFileSync(from, to);

const version = JSON.parse(
  readFileSync(join(root, "node_modules", "pdfjs-dist", "package.json"), "utf8")
).version;

console.log(`[pdf-worker] public/pdf.worker.min.mjs ← pdfjs-dist ${version}`);
