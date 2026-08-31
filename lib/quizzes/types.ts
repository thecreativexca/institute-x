import type { QuizType, QuizAttemptStatus } from "@/lib/constants";

/**
 * Shared, client-safe DTO types for the quiz engine.
 * These are pure JSON (strings/numbers/booleans/null) so they can cross the
 * server boundary to client components without leaking server secrets.
 */

/** Stable error codes returned to the client. */
export const QUIZ_ACCESS_ERROR = {
  NOT_AUTHENTICATED: "not_authenticated",
  NOT_ENROLLED: "not_enrolled",
  QUIZ_NOT_FOUND: "quiz_not_found",
  NOT_PUBLISHED: "not_published",
  NOT_AVAILABLE_YET: "not_available_yet",
  NO_LONGER_AVAILABLE: "no_longer_available",
  NO_QUESTIONS: "no_questions",
  ATTEMPT_LIMIT: "attempt_limit",
  ATTEMPT_NOT_FOUND: "attempt_not_found",
  ATTEMPT_INVALID: "attempt_invalid",
  ATTEMPT_EXPIRED: "attempt_expired",
  INVALID_QUESTION: "invalid_question",
  INVALID_OPTION: "invalid_option",
} as const;

export type QuizAccessErrorCode =
  (typeof QUIZ_ACCESS_ERROR)[keyof typeof QUIZ_ACCESS_ERROR];

export type QuizAvailability =
  | "available"
  | "upcoming"
  | "expired"
  | "no_questions";

export interface QuizOptionView {
  id: string;
  text: string;
}

/** One quiz card on the "My Quizzes" list. */
export interface QuizSummaryListItem {
  id: string;
  title: string;
  description: string | null;
  type: QuizType;
  courseId: string;
  courseTitle: string;
  moduleId: string | null;
  moduleTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  questionCount: number;
  totalMarks: number;
  passingPercentage: number;
  durationMinutes: number | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  bestPercentage: number | null;
  bestScore: number | null;
  latestSubmittedAttemptId: string | null;
  inProgressAttemptId: string | null;
  availability: QuizAvailability;
  canAttempt: boolean;
  blockReason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
}

export interface AttemptHistoryRow {
  attemptId: string;
  attemptNumber: number;
  submittedAt: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  status: QuizAttemptStatus;
  passed: boolean;
}

/** Data for the quiz instructions page. */
export interface QuizDetailViewData {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  type: QuizType;
  courseId: string;
  courseTitle: string;
  moduleId: string | null;
  moduleTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  questionCount: number;
  totalMarks: number;
  passingPercentage: number;
  durationMinutes: number | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  bestPercentage: number | null;
  bestScore: number | null;
  inProgressAttemptId: string | null;
  inProgressRemainingSeconds: number | null;
  availability: QuizAvailability;
  canAttempt: boolean;
  blockReason: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  history: AttemptHistoryRow[];
}

/** One question rendered during an active attempt (no correct answers). */
export interface AttemptQuestionView {
  id: string;
  question: string;
  options: QuizOptionView[];
  marks: number;
  order: number;
}

/** Data for the MCQ attempt interface. */
export interface AttemptViewData {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseTitle: string;
  type: QuizType;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  attemptNumber: number;
  durationMinutes: number | null;
  /** Absolute epoch-ms server deadline. null when no time limit. */
  deadlineAt: number | null;
  /** Server epoch-ms at response time, used to anchor the countdown. */
  serverNow: number;
  totalMarks: number;
  passingPercentage: number;
  questions: AttemptQuestionView[];
  /** questionId -> selectedOptionId (already persisted). */
  answers: Record<string, string>;
  answeredCount: number;
  totalQuestions: number;
}

/** One question shown on the result page when review is allowed. */
export interface ReviewQuestionView {
  id: string;
  question: string;
  options: QuizOptionView[];
  marks: number;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean | null;
  explanation: string | null;
}

/** Data for the result page. */
export interface QuizResultViewData {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizDescription: string | null;
  type: QuizType;
  courseId: string;
  courseTitle: string;
  status: QuizAttemptStatus;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passingPercentage: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  timeTakenSeconds: number | null;
  showCorrectAnswers: boolean;
  /** Null when showCorrectAnswers is false (enforced server-side). */
  questions: ReviewQuestionView[] | null;
  maxAttempts: number | null;
  attemptsUsed: number;
  inProgressAttemptId: string | null;
  history: AttemptHistoryRow[];
}

/** Minimal shape the scoring engine needs from an attempt. */
export interface AttemptForEvaluation {
  answers: Array<{
    questionId: { toString(): string };
    selectedOptionId: string;
  }>;
  questionOrder: Array<{ toString(): string }>;
}
