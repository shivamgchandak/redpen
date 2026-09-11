import { z } from "zod";
import { looseBoolean, looseFraction, looseString, toNumber } from "../loose";

export const RawGrade = z.object({
  questionNumber: looseString(""),
  covered: z
    .array(
      z.object({
        index: z.preprocess((v) => toNumber(v) ?? -1, z.number()),
        quote: looseString(""),
      })
    )
    .catch([])
    .default([]),
  coveredPoints: z
    .preprocess((v) => (Array.isArray(v) ? v.map((x) => toNumber(x) ?? -1) : []), z.array(z.number()))
    .catch([]),
  feedback: looseString(""),
  diagramUnverified: looseBoolean(false),
  illegible: looseBoolean(false),
  resultCorrect: looseBoolean(false),
  workingShown: looseBoolean(false),
  answerQuality: looseFraction(0),
});
// A batch of grades: one malformed entry must not discard the others.
export const RawPayload = z.object({
  grades: z.array(z.unknown()).transform((list) =>
    list.flatMap((item) => {
      const parsed = RawGrade.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    })
  ),
});

export type RawGradeValue = z.infer<typeof RawGrade>;
