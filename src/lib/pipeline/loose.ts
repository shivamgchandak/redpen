import { z } from "zod";

/**
 * Model output is loosely JSON, not typed. A mark written as "1", "½" or
 * "1 mark" must not throw away a whole page of results, so fields are read
 * leniently and bad values fall back instead of failing the parse.
 */

export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const text = value.replace(/½/g, ".5").trim();
  const fraction = /^(\d+)\s*\/\s*(\d+)/.exec(text);
  if (fraction && Number(fraction[2]) > 0) return Number(fraction[1]) / Number(fraction[2]);
  const match = /-?\d*\.?\d+/.exec(text);
  return match ? Number(match[0]) : null;
}

/** A number, a numeric string, or null. Anything else becomes null. */
export const looseNumber = z.preprocess((v) => toNumber(v), z.number().nullable()).catch(null);

/** A number in [0, 1], defaulting when missing or unreadable. */
export const looseFraction = (fallback: number) =>
  z.preprocess((v) => {
    const n = toNumber(v);
    return n === null ? fallback : Math.min(1, Math.max(0, n));
  }, z.number());

export const looseBoolean = (fallback = false) =>
  z.preprocess((v) => (typeof v === "string" ? v.trim().toLowerCase() === "true" : v), z.boolean()).catch(fallback);

export const looseString = (fallback = "") =>
  z.preprocess((v) => (v === null || v === undefined ? fallback : String(v)), z.string());

export const looseStrings = z
  .preprocess((v) => (Array.isArray(v) ? v.filter((x) => typeof x === "string") : []), z.array(z.string()))
  .catch([]);
