import type { Grade, Question } from "@/lib/types";

/**
 * The closing remark on a script, written from the marks themselves rather
 * than by the model. Every question already has its own feedback, so this
 * saves one call per script and can never contradict the marks shown.
 */

function list(items: string[], max = 4): string {
  const shown = items.slice(0, max);
  const extra = items.length - shown.length;
  if (extra > 0) return `${shown.join(", ")} and ${extra} more`;
  if (shown.length <= 1) return shown.join("");
  return `${shown.slice(0, -1).join(", ")} and ${shown[shown.length - 1]}`;
}

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function describeScript(grades: Grade[], questions: Question[]): string {
  const display = new Map(questions.map((q) => [q.number, q.display]));
  const numberOf = (g: Grade) => String(display.get(g.questionNumber) ?? g.questionNumber);
  const named = (gs: Grade[]) => `${gs.length === 1 ? "question" : "questions"} ${list(gs.map(numberOf))}`;
  const counted = grades.filter((g) => g.counted);
  const ratio = (g: Grade) => (g.maxMarks ? (g.score ?? 0) / g.maxMarks : 0);

  const skipped = counted.filter((g) => g.verdict === "unattempted");
  const attempted = counted.filter((g) => g.verdict !== "unattempted");
  const strong = attempted.filter((g) => ratio(g) >= 0.75);
  const weak = attempted.filter((g) => ratio(g) < 0.5);

  const parts: string[] = [];
  parts.push(
    strong.length > 0
      ? `Strongest on ${named(strong)}.`
      : `Attempted ${attempted.length} of ${counted.length} questions.`
  );
  if (weak.length > 0) parts.push(`Worth another look: ${named(weak)}.`);
  if (skipped.length > 0) {
    parts.push(`${capitalise(named(skipped))} ${skipped.length === 1 ? "was" : "were"} not attempted.`);
  } else if (counted.length > 0) {
    parts.push("Every question was attempted.");
  }
  return parts.join(" ");
}

export async function summarise(
  grades: Grade[],
  questions: Question[],
  _score: number,
  _maxScore: number
): Promise<string> {
  return describeScript(grades, questions);
}
