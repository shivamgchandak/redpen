import { FatalError } from "workflow";
import { connectDB } from "@/server/db/connect";
import { Classroom, Submission, Test } from "@/server/db/models";
import { loadAnswerPages, type StoredAnswerPage } from "@/server/marking/pages";
import { setSubmissionProgress } from "@/server/marking/progress";
import { withCallCount } from "@/server/marking/calls";
import { extractAnswers } from "@/lib/pipeline/answers";
import { mapAnswers } from "@/lib/pipeline/mapping";
import { gradeAll } from "@/lib/pipeline/grading";
import type { MarkScheme } from "@/lib/marks";
import type { AnswerBlock, Mapping, Question } from "@/lib/types";

/**
 * Steps for marking one answer sheet. The paper and rubric were read once for
 * the test, so only the script's own stages run here. Every stage's model
 * calls are also cached on their inputs, so a retried step is nearly free.
 */

async function load(submissionId: string) {
  await connectDB();
  const sub = await Submission.findById(submissionId);
  if (!sub) throw new FatalError("Answer sheet not found.");
  const test = await Test.findById(sub.testId).lean();
  if (!test) throw new FatalError("Test not found.");
  if (test.status !== "locked") throw new FatalError("The rubric is not locked.");
  return { sub, test, questions: (test.questions ?? []) as unknown as Question[] };
}

export async function readAnswersStep(submissionId: string): Promise<number> {
  "use step";

  const { sub } = await load(submissionId);
  sub.status = "reading";
  sub.error = null;
  await sub.save();

  await setSubmissionProgress(submissionId, "Loading the answer sheet", 0.04, true);
  // The schema adds annotatedPathname and lines to a cloned page schema, which Mongoose types cannot see.
  const pages = await loadAnswerPages(sub.pages as unknown as StoredAnswerPage[]);

  await setSubmissionProgress(submissionId, "Reading the handwriting", 0.1, true);
  const answers = await withCallCount(`mark ${submissionId}: read`, () =>
    extractAnswers(pages, (done, total) => {
      void setSubmissionProgress(submissionId, `Reading the handwriting (page ${done} of ${total})`, 0.1 + 0.4 * (done / Math.max(1, total)));
    })
  );

  await Submission.updateOne({ _id: submissionId }, { $set: { answers, status: "mapping" } });
  return answers.length;
}

export async function mapAnswersStep(submissionId: string): Promise<number> {
  "use step";

  const { sub, questions } = await load(submissionId);
  await setSubmissionProgress(submissionId, "Matching answers to questions", 0.52, true);

  const answers = (sub.answers ?? []) as AnswerBlock[];
  const { mappings, unmatchedAnswerIds, warnings } = await withCallCount(`mark ${submissionId}: match`, () =>
    mapAnswers(questions, answers)
  );

  await Submission.updateOne(
    { _id: submissionId },
    { $set: { mappings, unmatchedAnswerIds, warnings, status: "grading" } }
  );
  return mappings.filter((m) => m.answerId).length;
}

export async function gradeStep(submissionId: string): Promise<void> {
  "use step";

  const { sub, test, questions } = await load(submissionId);
  const room = await Classroom.findById(test.classroomId).lean();
  const context = { subject: room?.subject ?? "", grade: room?.grade ?? "" };
  const rubric = new Map<string, MarkScheme>(
    (test.rubric ?? []).map((r) => [r.questionNumber, r.scheme as MarkScheme])
  );

  const answers = (sub.answers ?? []) as AnswerBlock[];
  const mappings = (sub.mappings ?? []) as Mapping[];
  const attempted = mappings.filter((m) => m.answerId).length;
  await setSubmissionProgress(submissionId, `Marking ${attempted} answers`, 0.58, true);

  const { grades, summary, warnings } = await withCallCount(`mark ${submissionId}: grade`, () => gradeAll({
    questions,
    answers,
    mappings,
    unmatchedAnswerIds: sub.unmatchedAnswerIds ?? [],
    rubric,
    context,
    onProgress: (done, total) => {
      void setSubmissionProgress(submissionId, `Marking answers (${done} of ${total})`, 0.58 + 0.4 * (done / Math.max(1, total)));
    },
  }));

  const needsReview = grades.some((g) => g.needsReview);
  await Submission.updateOne(
    { _id: submissionId },
    {
      $set: {
        status: needsReview ? "needs_review" : "done",
        grades: grades.map((g) => ({
          ...g,
          reviewNote: g.reviewNote ?? null,
          overrideScore: null,
          overrideNote: null,
        })),
        summary,
        total: summary.score,
        maxTotal: summary.maxScore,
        warnings: [...(sub.warnings ?? []), ...warnings],
        error: null,
        progress: null,
        elapsedMs: sub.queuedAt ? Date.now() - new Date(sub.queuedAt).getTime() : null,
        markedAt: new Date(),
      },
    }
  );
}

export async function failSubmissionStep(submissionId: string, message: string): Promise<void> {
  "use step";

  await connectDB();
  await Submission.updateOne(
    { _id: submissionId },
    { $set: { status: "failed", error: message, progress: null } }
  );
}
