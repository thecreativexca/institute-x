/**
 * Phase 11 progress service — single import point for the whole system.
 *
 * Business logic lives HERE, not inside React components (spec §37).
 *
 *   percentages.ts  → safe percentage helpers (spec §40)
 *   types.ts        → client-safe DTO types
 *   learning.ts     → pure lesson/module/learning calculations (spec §5–§15)
 *   assignments.ts  → pure assignment performance calculations (spec §16/§17)
 *   quizzes.ts      → pure quiz/best-attempt calculations (spec §18–§20)
 *   completion.ts   → centralized course completion rule engine (spec §21–§27)
 *   data.ts         → batched, projection-limited database reads (spec §36)
 *   course.ts       → per-course detail assembly + idempotent completion write
 *   student.ts      → student-wide overview + shared card computation
 */
export * from "./types";
export * from "./percentages";
export * from "./completion";
export {
  computeLessonProgressSummary,
  computeModuleProgressViews,
  deriveModuleStatus,
  deriveCourseLearningStatus,
  buildContinueLearning,
  findLastAccessedLesson,
  buildLessonActivity,
  type LessonRow,
  type ModuleRow,
  type ProgressRow,
} from "./learning";
export {
  computeAssignmentSummary,
  type AssignmentRow,
  type SubmissionRow,
} from "./assignments";
export {
  computeQuizSummary,
  pickBestAttempt,
  type QuizRow,
  type AttemptRow,
} from "./quizzes";
export {
  buildCourseContext,
  type CourseComputationContext,
  type BatchRows,
} from "./data";
export {
  loadCourseBatch,
  assembleCourseDetail,
  computeLessonProgress,
  computeAssignments,
  computeQuizzes,
  buildRecentActivity,
  completeEnrollmentIfEligible,
  buildContinueAction,
} from "./course";
export {
  loadStudentRows,
  buildCourseContexts,
  computeCourseCard,
  sortCourseCards,
  getStudentProgressOverview,
  getStudentCourseCards,
  getLessonProgressForStudent,
} from "./student";