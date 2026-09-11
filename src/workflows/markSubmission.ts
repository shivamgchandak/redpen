import {
  failSubmissionStep,
  gradeStep,
  mapAnswersStep,
  readAnswersStep,
} from "./steps/submissionSteps";

/**
 * Marks one answer sheet in the background: read, match, grade. Each step is
 * saved when it finishes, so a failure midway retries only that step, and
 * the teacher can leave the page while it runs.
 */
export async function markSubmissionWorkflow(submissionId: string): Promise<void> {
  "use workflow";

  try {
    await readAnswersStep(submissionId);
    await mapAnswersStep(submissionId);
    await gradeStep(submissionId);
  } catch (error) {
    await failSubmissionStep(submissionId, error instanceof Error ? error.message : String(error));
  }
}
