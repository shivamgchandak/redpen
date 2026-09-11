import { buildRubricStep, failTestStep, readQuestionsStep } from "./steps/testSteps";

/**
 * Reads a test's question paper and rubric in the background, once for the
 * whole class. The teacher can close the tab; the review page picks up the
 * saved result whenever they come back.
 */
export async function readTestWorkflow(testId: string): Promise<void> {
  "use workflow";

  try {
    const paper = await readQuestionsStep(testId);
    await buildRubricStep(testId, paper);
  } catch (error) {
    await failTestStep(testId, error instanceof Error ? error.message : String(error));
  }
}
