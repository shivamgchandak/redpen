import type { AnalysisResult, Region } from "@/lib/types";

export interface ActiveAnswer {
  label: string;
  regions: Region[];
}

export interface OtherRegion {
  region: Region;
  label: string;
}

export function labelForAnswer(result: AnalysisResult, answerId: string): string {
  const mapping = result.mappings.find((m) => m.answerId === answerId);

  if (mapping) {
    const question = result.questions.find(
      (q) => q.number === mapping.questionNumber
    );
    return `Question ${question?.display ?? mapping.questionNumber}`;
  }

  const answer = result.answers.find((a) => a.id === answerId);
  return answer?.writtenLabel
    ? `Question ${answer.writtenLabel} (unmatched)`
    : "Unmatched";
}

export function splitRegions(
  result: AnalysisResult,
  selected: string | null
): { active: ActiveAnswer | null; others: OtherRegion[] } {
  const mapping = result.mappings.find((m) => m.questionNumber === selected);
  const activeAnswer = result.answers.find((a) => a.id === mapping?.answerId);

  return {
    active: activeAnswer
      ? {
          label: labelForAnswer(result, activeAnswer.id),
          regions: activeAnswer.regions,
        }
      : null,
    others: result.answers
      .filter((a) => a.id !== activeAnswer?.id)
      .flatMap((a) =>
        a.regions.map((region) => ({
          region,
          label: labelForAnswer(result, a.id),
        }))
      ),
  };
}
