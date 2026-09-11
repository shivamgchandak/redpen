import type { AnswerBlock, Grade, LineBox, Mapping, Question, Summary } from "@/lib/types";
import type { MarkScheme } from "@/lib/marks";

/**
 * Plain, serialisable shapes handed from server components to client
 * components. Mongoose documents never cross that boundary.
 */

export interface ClassroomDTO {
  id: string;
  name: string;
  school: string;
  grade: string;
  section: string;
  subject: string;
  createdAt: string;
}

export interface ClassroomSummaryDTO extends ClassroomDTO {
  studentCount: number;
  testCount: number;
}

export interface StudentDTO {
  id: string;
  name: string;
  rollNo: string;
}

export type TestStatus = "draft" | "reading" | "review" | "locked" | "failed";

export interface ProgressDTO {
  label: string;
  value: number;
  updatedAt: string;
}

export interface BlobFileDTO {
  pathname: string;
  name: string;
  size: number;
  contentType: string;
  pages: number | null;
}

export interface PageImageDTO {
  index: number;
  pathname: string;
  width: number;
  height: number;
}

export interface RubricEntryDTO {
  questionNumber: string;
  source: "teacher" | "generated";
  scheme: MarkScheme;
  editedByTeacher: boolean;
}

export interface TestSummaryDTO {
  id: string;
  title: string;
  status: TestStatus;
  questionCount: number;
  markedCount: number;
  createdAt: string;
}

export interface TestDTO {
  id: string;
  classroomId: string;
  title: string;
  status: TestStatus;
  paper: BlobFileDTO;
  rubricFile: BlobFileDTO | null;
  paperPages: PageImageDTO[];
  rubricPages: PageImageDTO[];
  questions: Question[];
  rubric: RubricEntryDTO[];
  detectedSubject: string | null;
  warnings: string[];
  error: string | null;
  progress: ProgressDTO | null;
  lockedAt: string | null;
}

export type SubmissionStatus =
  | "uploaded"
  | "queued"
  | "reading"
  | "mapping"
  | "grading"
  | "done"
  | "needs_review"
  | "failed";

export interface StoredGrade extends Grade {
  overrideScore: number | null;
  overrideNote: string | null;
}

export interface SubmissionRowDTO {
  id: string;
  studentId: string;
  status: SubmissionStatus;
  total: number | null;
  maxTotal: number | null;
  reviewCount: number;
  markedAt: string | null;
  error: string | null;
  progress: ProgressDTO | null;
}

export interface AnswerPageDTO extends PageImageDTO {
  annotatedPathname: string;
  lines: LineBox[];
}

export interface SubmissionDTO extends SubmissionRowDTO {
  testId: string;
  sourceFile: BlobFileDTO;
  pages: AnswerPageDTO[];
  answers: AnswerBlock[];
  mappings: Mapping[];
  grades: StoredGrade[];
  summary: Summary | null;
  warnings: string[];
  elapsedMs: number | null;
}
