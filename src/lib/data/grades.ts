import type { Grade } from "@/lib/types";
import type { StoredGrade } from "./dto";

/** The mark that counts: the teacher's override when there is one. */
export function effectiveScore(grade: StoredGrade): number {
  return grade.overrideScore ?? grade.score ?? 0;
}

export function effectiveTotal(grades: StoredGrade[]): number {
  const total = grades.reduce((sum, g) => (g.counted ? sum + effectiveScore(g) : sum), 0);
  return Math.round(total * 2) / 2;
}

/** Grades as the result screen shows them, with overrides applied. */
export function withOverrides(grades: StoredGrade[]): Grade[] {
  return grades.map((g) => {
    if (g.overrideScore === null || g.overrideScore === undefined) return g;
    const max = g.maxMarks ?? 0;
    const score = g.overrideScore;
    return {
      ...g,
      score,
      verdict:
        g.verdict === "unattempted" && score === 0
          ? "unattempted"
          : score <= 0
            ? "incorrect"
            : max && score >= max
              ? "correct"
              : "partial",
      needsReview: false,
      reviewNote: g.overrideNote
        ? `Mark set by you: ${g.overrideNote}`
        : "Mark set by you.",
    };
  });
}
