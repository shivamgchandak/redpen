import type { Grade, Question } from "@/lib/types";

export function applyChoiceGroups(grades: Grade[], questions: Question[]): Grade[] {
  const groups = new Map<string, { chooseCount: number; numbers: string[] }>();

  for (const q of questions) {
    if (!q.group || !q.chooseCount) continue;
    const entry = groups.get(q.group) ?? { chooseCount: q.chooseCount, numbers: [] };
    entry.numbers.push(q.number);
    groups.set(q.group, entry);
  }

  if (groups.size === 0) return grades;

  const byNumber = new Map(grades.map((g) => [g.questionNumber, g]));

  for (const { chooseCount, numbers } of groups.values()) {
    const attemptedInGroup = numbers
      .map((n) => byNumber.get(n))
      .filter((g): g is Grade => Boolean(g) && g!.verdict !== "unattempted");

    if (attemptedInGroup.length <= chooseCount) continue;

    const ranked = [...attemptedInGroup].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    for (const g of ranked.slice(chooseCount)) {
      g.counted = false;
      g.reviewNote = "Extra attempt. It was marked, but not counted toward the total.";
    }
  }

  return grades;
}

export function paperMaxMarks(questions: Question[]): number {
  const seenGroups = new Set<string>();
  let total = 0;

  for (const q of questions) {
    if (q.group && q.chooseCount) {
      if (seenGroups.has(q.group)) continue;
      seenGroups.add(q.group);

      const members = questions.filter((x) => x.group === q.group);
      const marks = members
        .map((x) => x.maxMarks ?? 0)
        .sort((a, b) => b - a)
        .slice(0, q.chooseCount);
      total += marks.reduce((a, b) => a + b, 0);
      continue;
    }
    total += q.maxMarks ?? 0;
  }

  return total;
}

