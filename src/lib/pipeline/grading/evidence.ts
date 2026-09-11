import { QUOTE_MATCH_THRESHOLD } from "./prompts";
import type { AnswerBlock } from "@/lib/types";

const FILLER = new Set([
  "the", "and", "for", "are", "was", "were", "with", "that", "this", "from",
  "into", "than", "then", "they", "them", "there", "their", "which", "when",
  "have", "has", "had", "been", "being", "will", "would", "can", "could",
  "also", "some", "such", "these", "those", "very", "more", "most", "its",
  "it", "is", "of", "to", "in", "on", "as", "at", "by", "or", "an", "a",
]);

export function normalise(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function looseIncludes(haystack: string, word: string): boolean {
  if (haystack.includes(word)) return true;
  if (word.length > 5) return haystack.includes(word.slice(0, word.length - 2));
  return false;
}

export function evidencePool(answer: AnswerBlock | undefined): string {
  if (!answer) return "";
  return [answer.text, ...(answer.diagramLabels ?? [])].join(" . ");
}

export function quoteIsSupported(quote: string, answer: string): boolean {
  const q = normalise(quote);
  const a = normalise(answer);
  if (q.length === 0 || a.length === 0) return false;
  if (a.includes(q)) return true;

  const words = q.split(" ").filter((w) => w.length > 2 && !FILLER.has(w));
  if (words.length === 0) return false;

  const found = words.filter((w) => looseIncludes(a, w)).length;
  return found / words.length >= QUOTE_MATCH_THRESHOLD;
}

