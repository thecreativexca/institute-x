import type { ProgressStatus, QuizType } from "@/lib/constants";
import type { ICompletionCriteria } from "@/models/Course";

/**
 * Client-safe DTO types for the Phase 11 progress system.
 *
 * Everything here is plain JSON (strings / numbers / booleans / null) so it can
 * cross the server → client boundary without leaking driver internals. The same
 * types are produced by the DB services (lib/progress/course.ts, student.ts)
 * and consumed by the pure calculation helpers and the React UI.
 */

/* ---------------------------- Status taxonomy ------------------------------ */

/** Per-module learning state derived from its published lessons. */
export type ModuleStatus = "not_started" | "in_progress" | "completed";

/** Course learning state — lesson-based only (spec §9). */
export type CourseLearningStatus =
  | "not_started"
  | "in_progress"
  | "learning_complete";

/**
 * Overall course state (spec §24):
 *   - NOT_STARTED          no lesson progress yet
 *   - IN_PROGRESS          some lessons completed
 *   - REQUIREMENTS_PENDING lessons done but configured criteria unmet
 *   - COMPLETED            all configured criteria satisfied (or preserved)
 */
export type CourseOverallStatus =
  | "not_started"
  | "in_progress"
  | "requirements_pending"
  | "completed";

/* ------------------------------- Learning ---------------------------------- */

/** One published lesson's completion state (used inside module rows). */
export interface LessonProgressLine {
  lessonId: string;
  title: string;
  moduleId: string;
  status: ProgressStatus;
  completedAt: string | null;
  lastViewedAt: string | null;
}

/** One module's progress (spec §7/§8). */
export interface ModuleProgressView {
  moduleId: string;
  title: string;
  description: string | null;
  /** Published lessons only. */
  totalLessons: number;
  completedLessons: number;
  /** null when the module has zero published lessons — never a fake 0%. */
  percent: number | null;
  status: ModuleStatus;
  hasContent: boolean;
  lessons: LessonProgressLine[];
}

export interface LastAccessedLesson {
  lessonId: string;
  title: string;
  moduleId: string;
  moduleTitle: string | null;
  /** ISO timestamp of the most recent view (server time). */
  accessedAt: string;
}

export interface ContinueLearningAction {
  lessonId: string;
  lessonTitle: string;
  href: string;
  /** true when resuming a previously visited lesson, false for first lesson. */
  isResume: boolean;
}

/**
 * Lesson progress for one course:
 * `completed published lessons / total published lessons × 100`.
 * `percent`/`hasContent` handle the zero-published-lessons case (spec §6).
 */
export interface LessonProgressSummary {
  totalPublishedLessons: number;
  completedLessons: number;
  /** null when there are zero published lessons — "content not available yet". */
  percent: number | null;
  hasContent: boolean;
  learningStatus: CourseLearningStatus;
  lastAccessedLesson: LastAccessedLesson | null;
  continueLearning: ContinueLearningAction | null;
}
/* ----------------------------- Assignments --------------------------------- */

/**
 * Assignment performance for one course. All counts reference published
 * assignments only (spec §16). `isLate` is derived from dueAt vs submittedAt.
 */
export interface AssignmentStatSummary {
  totalAssignments: number;
  submitted: number;
  pending: number;
  graded: number;
  late: number;
  /** Normalized: Σ score / Σ maxScore × 100 across graded submissions. */
  averagePercent: number | null;
  hasAssignments: boolean;
}

/* -------------------------------- Quizzes ---------------------------------- */

/** Best (finalized) attempt view — the best-attempt policy (spec §19). */
export interface BestQuizAttemptView {
  quizId: string;
  title: string;
  type: QuizType;
  attemptId: string;
  attemptNumber: number;
  percentage: number;
  score: number;
  totalMarks: number;
  passed: boolean;
  submittedAt: string | null;
}

/**
 * Quiz performance for one course. Every attempted quiz contributes exactly one
 * "best" attempt; retakes are never counted as separate quizzes (spec §19).
 */
export interface QuizStatSummary {
  availableQuizzes: number;
  attempted: number;
  passed: number;
  failed: number;
  /** Normalized best-attempt performance: Σ score / Σ totalMarks × 100. */
  averagePercent: number | null;
  bestAttempts: BestQuizAttemptView[];
  /** Separate view of the final assessment when the course has one. */
  finalTest:
    | {
        quizId: string;
        title: string;
        attempted: boolean;
        passed: boolean;
        bestPercentage: number | null;
      }
    | null;
}

/* ------------------------------ Completion --------------------------------- */

export interface CompletionRequirementView {
  key: "lessons" | "assignments" | "quizzes" | "final_test";
  label: string;
  detail: string;
  met: boolean;
  enabled: boolean;
}

export interface CourseCompletionEvaluation {
  lessonRequirementMet: boolean;
  /** null when not configured for this course. */
  assignmentRequirementMet: boolean | null;
  quizRequirementMet: boolean | null;
  finalTestRequirementMet: boolean | null;
  eligibleForCompletion: boolean;
  /** Lesson-based completion percentage (null when no published lessons). */
  completionPercentage: number | null;
  reasonsPending: string[];
  /** Only the criteria actually configured for the course. */
  requirements: CompletionRequirementView[];
  criteria: ICompletionCriteria;
}

export interface CertificateReadiness {
  courseCompleted: boolean;
  /** ISO date the enrollment was marked completed (null when not completed). */
  completionDate: string | null;
  criteriaSatisfied: boolean;
  /** True when the course is completed — certificate *generation* is Phase 12. */
  certificateReady: boolean;
}

/* ---------------------------- Recent activity ------------------------------ */

export type ActivityType =
  | "course_started"
  | "lesson_accessed"
  | "lesson_completed"
  | "module_completed"
  | "assignment_submitted"
  | "quiz_passed"
  | "course_completed";

export interface RecentActivityItem {
  type: ActivityType;
  label: string;
  detail: string;
  /** Server timestamp, ISO. */
  at: string;
}

/* ------------------------------ Course views ------------------------------- */

/** Header + overview data for the course detail progress page. */
export interface CourseProgressHeader {
  courseId: string;
  courseName: string;
  courseSlug: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  level: string;
  enrolledAt: string;
  /** Enrollment lifecycle status (active/completed/pending...). */
  enrollmentStatus: string;
  learningStatus: CourseLearningStatus;
  overallStatus: CourseOverallStatus;
  hasContent: boolean;
  lessonProgress: LessonProgressSummary;
  assignmentSummary: AssignmentStatSummary;
  quizSummary: QuizStatSummary;
}

/** Fully-computed detail for `/student/progress/[courseId]`. */
export interface CourseProgressDetailView {
  header: CourseProgressHeader;
  modules: ModuleProgressView[];
  completion: CourseCompletionEvaluation;
  certificateReadiness: CertificateReadiness;
  recentActivity: RecentActivityItem[];
}

/** One card on the `/student/progress` overview (spec §12). */
export interface CourseProgressCard {
  courseId: string;
  courseName: string;
  courseSlug: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  level: string;
  progressPercent: number | null;
  completedLessons: number;
  totalLessons: number;
  hasContent: boolean;
  status: CourseOverallStatus;
  learningStatus: CourseLearningStatus;
  lastActivity: {
    lessonTitle: string;
    moduleTitle: string | null;
    accessedAt: string;
  } | null;
  continueLearning: ContinueLearningAction | null;
  enrollmentStatus: string;
  completedAt: string | null;
}

/** Top-level overview for `/student/progress` (spec §11). */
export interface StudentProgressOverview {
  enrolledCourses: number;
  coursesStarted: number;
  learningCompleted: number;
  lessonsCompleted: number;
  totalPublishedLessons: number;
  courses: CourseProgressCard[];
}