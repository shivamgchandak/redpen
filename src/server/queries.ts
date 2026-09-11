import "server-only";
import { connectDB } from "@/server/db/connect";
import { Classroom, Student, Submission, Test } from "@/server/db/models";
import type { MarkScheme } from "@/lib/marks";
import type { AnswerBlock, Mapping, Question, Summary } from "@/lib/types";
import type {
  AnswerPageDTO,
  BlobFileDTO,
  ClassroomDTO,
  ClassroomSummaryDTO,
  PageImageDTO,
  ProgressDTO,
  RubricEntryDTO,
  StoredGrade,
  StudentDTO,
  SubmissionDTO,
  SubmissionRowDTO,
  SubmissionStatus,
  TestDTO,
  TestStatus,
  TestSummaryDTO,
} from "@/lib/data/dto";
import { compareStudents, iso, isoOrNull, oid } from "./scope";

/**
 * Every read here takes the current teacher's id and filters on it, so a
 * guessed id from another teacher simply comes back as "not found".
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Lean = Record<string, any>;

function toClassroom(doc: Lean): ClassroomDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    school: doc.school,
    grade: doc.grade,
    section: doc.section ?? "",
    subject: doc.subject,
    createdAt: iso(doc.createdAt),
  };
}

function toFile(doc: Lean | null | undefined): BlobFileDTO | null {
  if (!doc) return null;
  return {
    pathname: doc.pathname,
    name: doc.name,
    size: doc.size,
    contentType: doc.contentType,
    pages: doc.pages ?? null,
  };
}

function toPages(list: Lean[] | undefined): PageImageDTO[] {
  return (list ?? []).map((p) => ({
    index: p.index,
    pathname: p.pathname,
    width: p.width,
    height: p.height,
  }));
}

function toQuestions(list: Lean[] | undefined): Question[] {
  return (list ?? []).map((q) => ({
    number: q.number,
    display: q.display,
    printedOrder: q.printedOrder,
    text: q.text,
    maxMarks: q.maxMarks ?? null,
    parent: q.parent ?? null,
    group: q.group ?? null,
    chooseCount: q.chooseCount ?? null,
  }));
}

function toGrades(list: Lean[] | undefined): StoredGrade[] {
  return (list ?? []).map((g) => ({
    questionNumber: g.questionNumber,
    score: g.score ?? null,
    maxMarks: g.maxMarks ?? null,
    verdict: g.verdict,
    feedback: g.feedback ?? "",
    counted: g.counted ?? true,
    needsReview: g.needsReview ?? false,
    ...(g.reviewNote ? { reviewNote: g.reviewNote } : {}),
    overrideScore: g.overrideScore ?? null,
    overrideNote: g.overrideNote ?? null,
  }));
}

function toProgress(p: Lean | null | undefined): ProgressDTO | null {
  return p ? { label: p.label, value: p.value, updatedAt: iso(p.updatedAt) } : null;
}

function toRow(doc: Lean): SubmissionRowDTO {
  const grades = toGrades(doc.grades);
  return {
    id: String(doc._id),
    studentId: String(doc.studentId),
    status: doc.status as SubmissionStatus,
    total: doc.total ?? null,
    maxTotal: doc.maxTotal ?? null,
    reviewCount: grades.filter((g) => g.needsReview && g.overrideScore === null).length,
    markedAt: isoOrNull(doc.markedAt),
    error: doc.error ?? null,
    progress: toProgress(doc.progress),
  };
}

export async function listClassrooms(teacherId: string): Promise<ClassroomSummaryDTO[]> {
  const owner = oid(teacherId);
  if (!owner) return [];
  await connectDB();

  const rooms = await Classroom.find({ ownerId: owner, archivedAt: null })
    .sort({ createdAt: -1 })
    .lean<Lean[]>();
  if (rooms.length === 0) return [];

  const ids = rooms.map((r) => r._id);
  const [students, tests] = await Promise.all([
    Student.aggregate<{ _id: unknown; n: number }>([
      { $match: { classroomId: { $in: ids } } },
      { $group: { _id: "$classroomId", n: { $sum: 1 } } },
    ]),
    Test.aggregate<{ _id: unknown; n: number }>([
      { $match: { classroomId: { $in: ids } } },
      { $group: { _id: "$classroomId", n: { $sum: 1 } } },
    ]),
  ]);
  const count = (rows: { _id: unknown; n: number }[]) =>
    new Map(rows.map((r) => [String(r._id), r.n]));
  const studentCounts = count(students);
  const testCounts = count(tests);

  return rooms.map((r) => ({
    ...toClassroom(r),
    studentCount: studentCounts.get(String(r._id)) ?? 0,
    testCount: testCounts.get(String(r._id)) ?? 0,
  }));
}

export async function getClassroom(
  teacherId: string,
  classroomId: string
): Promise<ClassroomDTO | null> {
  const owner = oid(teacherId);
  const id = oid(classroomId);
  if (!owner || !id) return null;
  await connectDB();
  const doc = await Classroom.findOne({ _id: id, ownerId: owner, archivedAt: null }).lean<Lean>();
  return doc ? toClassroom(doc) : null;
}

export async function listStudents(teacherId: string, classroomId: string): Promise<StudentDTO[]> {
  const owner = oid(teacherId);
  const id = oid(classroomId);
  if (!owner || !id) return [];
  await connectDB();
  const docs = await Student.find({ classroomId: id, ownerId: owner }).lean<Lean[]>();
  return docs
    .map((d) => ({ id: String(d._id), name: d.name, rollNo: d.rollNo ?? "" }))
    .sort(compareStudents);
}

export async function listTests(teacherId: string, classroomId: string): Promise<TestSummaryDTO[]> {
  const owner = oid(teacherId);
  const id = oid(classroomId);
  if (!owner || !id) return [];
  await connectDB();

  const tests = await Test.find({ classroomId: id, ownerId: owner })
    .select({ title: 1, status: 1, questions: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean<Lean[]>();
  if (tests.length === 0) return [];

  const marked = await Submission.aggregate<{ _id: unknown; n: number }>([
    {
      $match: {
        testId: { $in: tests.map((t) => t._id) },
        status: { $in: ["done", "needs_review"] },
      },
    },
    { $group: { _id: "$testId", n: { $sum: 1 } } },
  ]);
  const markedById = new Map(marked.map((m) => [String(m._id), m.n]));

  return tests.map((t) => ({
    id: String(t._id),
    title: t.title,
    status: t.status as TestStatus,
    questionCount: (t.questions ?? []).length,
    markedCount: markedById.get(String(t._id)) ?? 0,
    createdAt: iso(t.createdAt),
  }));
}

export async function getTest(teacherId: string, testId: string): Promise<TestDTO | null> {
  const owner = oid(teacherId);
  const id = oid(testId);
  if (!owner || !id) return null;
  await connectDB();
  const t = await Test.findOne({ _id: id, ownerId: owner }).lean<Lean>();
  if (!t) return null;

  return {
    id: String(t._id),
    classroomId: String(t.classroomId),
    title: t.title,
    status: t.status as TestStatus,
    paper: toFile(t.paper)!,
    rubricFile: toFile(t.rubricFile),
    paperPages: toPages(t.paperPages),
    rubricPages: toPages(t.rubricPages),
    questions: toQuestions(t.questions),
    rubric: (t.rubric ?? []).map(
      (r: Lean): RubricEntryDTO => ({
        questionNumber: r.questionNumber,
        source: r.source,
        scheme: r.scheme as MarkScheme,
        editedByTeacher: Boolean(r.editedByTeacher),
      })
    ),
    detectedSubject: t.detectedSubject ?? null,
    warnings: t.warnings ?? [],
    error: t.error ?? null,
    progress: toProgress(t.progress),
    lockedAt: isoOrNull(t.lockedAt),
  };
}

export async function listSubmissionRows(
  teacherId: string,
  testId: string
): Promise<SubmissionRowDTO[]> {
  const owner = oid(teacherId);
  const id = oid(testId);
  if (!owner || !id) return [];
  await connectDB();
  const docs = await Submission.find({ testId: id, ownerId: owner })
    .select({ studentId: 1, status: 1, total: 1, maxTotal: 1, grades: 1, markedAt: 1, error: 1, progress: 1 })
    .lean<Lean[]>();
  return docs.map(toRow);
}

export async function getSubmission(
  teacherId: string,
  testId: string,
  studentId: string
): Promise<SubmissionDTO | null> {
  const owner = oid(teacherId);
  const test = oid(testId);
  const student = oid(studentId);
  if (!owner || !test || !student) return null;
  await connectDB();
  const doc = await Submission.findOne({ testId: test, studentId: student, ownerId: owner }).lean<Lean>();
  if (!doc) return null;

  return {
    ...toRow(doc),
    testId: String(doc.testId),
    sourceFile: toFile(doc.sourceFile)!,
    pages: (doc.pages ?? []).map(
      (p: Lean): AnswerPageDTO => ({
        index: p.index,
        pathname: p.pathname,
        annotatedPathname: p.annotatedPathname,
        width: p.width,
        height: p.height,
        lines: p.lines ?? [],
      })
    ),
    answers: (doc.answers ?? []) as AnswerBlock[],
    mappings: (doc.mappings ?? []) as Mapping[],
    grades: toGrades(doc.grades),
    summary: (doc.summary ?? null) as Summary | null,
    warnings: doc.warnings ?? [],
    elapsedMs: doc.elapsedMs ?? null,
  };
}
