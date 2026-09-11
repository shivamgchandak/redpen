import { z } from "zod";
import { looseBoolean, looseNumber, looseStrings } from "./pipeline/loose";

const RawPoint = z.object({
  text: z.string(),
  kind: z
    .enum(["content", "diagram", "label", "working", "unit", "terminology"])
    .catch("content"),
  essential: looseBoolean(false),
  /** Marks for this point when the teacher's rubric gives them, for example "1 mark". */
  marks: looseNumber.default(null),
});

export const RawScheme = z.object({
  questionNumber: z.coerce.string(),
  answerType: z
    .enum(["recall", "explain", "diagram", "numerical", "application"])
    .catch("explain"),
  points: z.array(RawPoint).default([]),
  requiresDiagram: looseBoolean(false),
  diagramLabels: looseStrings,
});

export type MarkScheme = z.infer<typeof RawScheme>;

export function schemeProblems(
  scheme: MarkScheme,
  maxMarks: number
): string[] {
  const problems: string[] = [];
  const count = scheme.points.length;
  const min = Math.max(2, Math.floor(maxMarks * 1.5));
  const max = Math.ceil(maxMarks * 2) + 1;

  if (count < min) problems.push(`only ${count} items for ${maxMarks} marks (need ${min})`);
  if (count > max) problems.push(`${count} items for ${maxMarks} marks (over ${max})`);

  const essential = scheme.points.filter((p) => p.essential).length;
  if (essential === 0) problems.push("no essential items");
  if (essential > count) problems.push("more essentials than items");

  const vague = scheme.points.filter((p) => p.text.trim().split(/\s+/).length < 3);
  if (vague.length > 0) problems.push(`${vague.length} ${vague.length === 1 ? "item is" : "items are"} too vague to check`);

  if (scheme.requiresDiagram && scheme.diagramLabels.length === 0) {
    problems.push("diagram required but no labels listed");
  }

  return problems;
}

export const ITEMS_PER_MARK_FOR_FULL = 1.0;

export const DIAGRAM_TEXT_ONLY_CAP = 0.3;

export function roundMark(value: number, maxMarks: number): number {
  return Math.max(0, Math.min(maxMarks, Math.round(value * 2) / 2));
}

export function scoreFromCoverage({
  covered,
  total,
  essentialMissed,
  maxMarks,
}: {
  covered: number;
  total: number;
  essentialMissed: boolean;
  maxMarks: number;
}): number {
  if (total <= 0) return 0;

  const enough = Math.min(total, Math.ceil(maxMarks * ITEMS_PER_MARK_FOR_FULL));

  let score = maxMarks * Math.min(1, covered / enough);
  if (essentialMissed) score = Math.min(score, maxMarks - 0.5);

  return Math.max(0, Math.min(maxMarks, Math.round(score * 2) / 2));
}

export function formatMark(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** A rubric where every point carries its own marks (usually the teacher's). */
export function isWeighted(scheme: MarkScheme | undefined): boolean {
  const points = scheme?.points ?? [];
  return points.length > 0 && points.every((p) => typeof p.marks === "number" && p.marks > 0);
}

/**
 * Weighted marking: add up the marks of the points the student covered,
 * capped at the question's maximum. "Any three of these five, 1 mark each"
 * works on its own because of the cap.
 */
export function scoreFromWeights({
  covered,
  points,
  maxMarks,
}: {
  covered: Set<number>;
  points: { marks: number | null }[];
  maxMarks: number;
}): number {
  const earned = points.reduce((sum, p, i) => (covered.has(i) ? sum + (p.marks ?? 0) : sum), 0);
  return roundMark(Math.min(earned, maxMarks), maxMarks);
}
