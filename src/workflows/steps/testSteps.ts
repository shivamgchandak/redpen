import { FatalError } from "workflow";
import { connectDB } from "@/server/db/connect";
import { Classroom, Test } from "@/server/db/models";
import { loadPageImages } from "@/server/marking/pages";
import { setTestProgress } from "@/server/marking/progress";
import { withCallCount } from "@/server/marking/calls";
import { readQuestionPaper, type QuestionPaper } from "@/lib/pipeline/questions";
import { buildTestRubric } from "@/lib/pipeline/rubricUpload";
import { subjectsDiffer } from "@/lib/pipeline/subject";

/**
 * Steps for reading a test's paper and rubric. Each step is its own request,
 * saved when it finishes, and retried on its own if it fails. They pass ids
 * and small results only; files stay in Blob and state stays in MongoDB.
 */

export async function readQuestionsStep(testId: string): Promise<QuestionPaper> {
  "use step";

  await connectDB();
  const test = await Test.findById(testId).lean();
  if (!test) throw new FatalError("Test not found.");

  await setTestProgress(testId, "Loading the question paper", 0.04, true);
  const pages = await loadPageImages(test.paperPages);

  await setTestProgress(testId, "Reading the question paper", 0.1, true);
  const paper = await withCallCount(`test ${testId}: questions`, () =>
    readQuestionPaper(pages, (done, total) => {
      void setTestProgress(testId, `Reading the question paper (${done} of ${total})`, 0.1 + 0.3 * (done / Math.max(1, total)));
    })
  );

  if (paper.questions.length === 0) {
    throw new FatalError("No questions could be read from the question paper. Check it is the right file and clearly scanned.");
  }

  await setTestProgress(testId, `Found ${paper.questions.length} questions`, 0.42, true);
  return paper;
}

export async function buildRubricStep(testId: string, paper: QuestionPaper): Promise<void> {
  "use step";

  await connectDB();
  const test = await Test.findById(testId);
  if (!test) throw new FatalError("Test not found.");
  const room = await Classroom.findById(test.classroomId).lean();
  if (!room) throw new FatalError("Class not found.");

  const context = { subject: room.subject, grade: room.grade };
  const rubricPages = await loadPageImages(test.rubricPages);
  const questions = paper.questions;

  let at = 0.45;
  const rubric = await withCallCount(`test ${testId}: rubric`, () => buildTestRubric({
    questions,
    rubricPages,
    context,
    onProgress: (label) => {
      at = Math.min(0.9, at + 0.15);
      void setTestProgress(testId, label, at, true);
    },
  }));

  const detected = paper.subject;
  const warnings = [...rubric.warnings];
  if (subjectsDiffer(room.subject, detected)) {
    warnings.unshift(
      `This paper looks like ${detected}, but the class subject is ${room.subject}. Check you picked the right class.`
    );
  }

  test.set({
    questions: rubric.questions,
    rubric: rubric.entries.map((e) => ({ ...e, editedByTeacher: false })),
    detectedSubject: detected,
    warnings,
    status: "review",
    error: null,
    progress: null,
  });
  await test.save();
}

export async function failTestStep(testId: string, message: string): Promise<void> {
  "use step";

  await connectDB();
  await Test.updateOne({ _id: testId }, { $set: { status: "failed", error: message, progress: null } });
}
