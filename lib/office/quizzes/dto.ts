import { QUIZ_TYPES, QUIZ_ATTEMPT_STATUSES, type QuizType, type QuizAttemptStatus } from "@/lib/constants";

export interface OfficeQuizSummary {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  moduleId?: string | null;
  moduleTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  type: QuizType;
  questionCount: number;
  totalMarks: number;
  passingPercentage: number;
  durationMinutes: number | null;
  maxAttempts: number | null;
  isPublished: boolean;
  attemptCount: number;
  updatedAt: string;
}

export interface OfficeQuizDetail extends OfficeQuizSummary {
  description: string | null;
  instructions: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  createdAt: string;
  createdById: string;
  createdByName: string;
}

export interface OfficeQuestionSummary {
  id: string;
  quizId: string;
  question: string;
  optionCount: number;
  correctOptionId: string;
  marks: number;
  negativeMarks: number;
  order: number;
  isPublished: boolean;
}

export interface OfficeQuestionDetail extends OfficeQuestionSummary {
  options: QuestionOption[];
  explanation?: string | null;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface OfficeQuizResultSummary {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  status: QuizAttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number | null;
}

export interface OfficeQuizResultDetail extends OfficeQuizResultSummary {
  quizId: string;
  quizTitle: string;
  courseId: string;
  courseName: string;
  type: QuizType;
  questions: ReviewQuestion[];
}

export interface ReviewQuestion {
  id: string;
  question: string;
  options: QuestionOption[];
  marks: number;
  negativeMarks: number;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean | null;
  explanation?: string | null;
}

export interface QuizFilters {
  search?: string;
  courseId?: string;
  moduleId?: string;
  type?: QuizType | "all";
  status?: "published" | "draft" | "all";
}

export interface QuizSortOptions {
  field: "updatedAt" | "createdAt" | "title" | "attemptCount";
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface QuizListResult {
  quizzes: OfficeQuizSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuizInput {
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  title: string;
  description?: string;
  instructions?: string;
  type: QuizType;
  durationMinutes?: number | null;
  passingPercentage: number;
  maxAttempts?: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  isPublished?: boolean;
}

export interface UpdateQuizInput {
  title?: string;
  description?: string;
  instructions?: string;
  type?: QuizType;
  durationMinutes?: number | null;
  passingPercentage?: number;
  maxAttempts?: number | null;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  availableFrom?: string | null;
  availableUntil?: string | null;
  moduleId?: string | null;
  lessonId?: string | null;
  isPublished?: boolean;
}

export interface CreateQuestionInput {
  question: string;
  options: QuestionOption[];
  correctOptionId: string;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  order?: number;
  isPublished?: boolean;
}

export interface UpdateQuestionInput {
  question?: string;
  options?: QuestionOption[];
  correctOptionId?: string;
  marks?: number;
  negativeMarks?: number;
  explanation?: string;
  order?: number;
  isPublished?: boolean;
}

export interface ReorderQuestionsInput {
  questionOrders: { id: string; order: number }[];
}

export interface QuizPublishReadiness {
  ready: boolean;
  issues: string[];
}