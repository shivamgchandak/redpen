"use client";

import { createContext, useContext } from "react";

/**
 * On a teacher's saved result, each question can have its mark changed. The
 * demo has no provider, so the control simply does not appear there.
 */
export interface GradeOverrideApi {
  original: Record<string, number | null>;
  overrides: Record<string, number | null>;
  save: (questionNumber: string, score: number | null) => Promise<string | null>;
}

const OverrideContext = createContext<GradeOverrideApi | null>(null);

export const GradeOverrideProvider = OverrideContext.Provider;

export function useGradeOverride(): GradeOverrideApi | null {
  return useContext(OverrideContext);
}
