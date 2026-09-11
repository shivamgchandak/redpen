export type Stage =
  | "idle"
  | "uploading"
  | "extracting"
  | "mapping"
  | "grading"
  | "ready"
  | "error";

export type DocKind = "question" | "answer" | "rubric";

export interface SourceDoc {
  kind: DocKind;
  name: string;
  size: number;
  pages: number | null;
  mime: string;
}

export interface PageImage {
  index: number;
  dataUrl: string;
  width: number;
  height: number;
}

export interface LineBox {
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AnswerPage extends PageImage {
  lines: LineBox[];
  annotatedDataUrl: string;
}

export interface Region {
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Question {
  number: string;
  display: string;
  printedOrder: number;
  text: string;
  maxMarks: number | null;
  parent: string | null;
  group: string | null;
  chooseCount: number | null;
}

export interface AnswerBlock {
  id: string;
  writtenLabel: string | null;
  text: string;
  regions: Region[];
  pages: number[];
  hasDiagram: boolean;
  diagramLabels: string[];
}

export type MatchSource = "label" | "lexical" | "llm";

export interface Mapping {
  questionNumber: string;
  answerId: string | null;
  confidence: number;
  source: MatchSource | null;
  note?: string;
}

export type Verdict = "correct" | "partial" | "incorrect" | "unattempted";

export interface Grade {
  questionNumber: string;
  score: number | null;
  maxMarks: number | null;
  verdict: Verdict;
  feedback: string;
  counted: boolean;
  needsReview: boolean;
  reviewNote?: string;
}

export interface Summary {
  questionCount: number;
  attempted: number;
  unattempted: number;
  unmatchedAnswers: number;
  score: number;
  maxScore: number;
  overallFeedback: string;
}

export interface AnalysisResult {
  jobId: string;
  questions: Question[];
  answers: AnswerBlock[];
  mappings: Mapping[];
  grades: Grade[];
  summary: Summary;
  answerPageSizes: { width: number; height: number }[];
  elapsedMs: number;
  warnings: string[];
}

export interface SheetPage {
  dataUrl: string;
  width: number;
  height: number;
}
