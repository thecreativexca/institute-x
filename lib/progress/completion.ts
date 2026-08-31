import type {
  CertificateReadiness,
  CompletionRequirementView,
  CourseCompletionEvaluation,
  LessonProgressSummary,
} from "./types";
import type { AssignmentStatSummary } from "./types";
import type { QuizStatSummary } from "./types";
import type { CourseLearningStatus } from "./types";
import type { ICompletionCriteria } from "@/models/Course";
import { safePercentage } from "./percentages";

/**
 * Centralized course completion rule engine (spec §21–§23).
 *
 * Every completion decision in the application goes through
 * `calculateCourseCompletionEvaluation` — never scattered in UI components.
 *
 * DEFAULT RULES (spec §23) — applied when a course has no explicit
 * `completionCriteria` configured yet:
 *
 *   - All required published lessons  →  completed     (REQUIRED)
 *   - Assignments                    →  NOT required, unless configured
 *   - Quizzes                        →  NOT required, unless configured
 *   - Final test                     →  NOT required, unless configured
 *
 * These defaults are intentionally conservative: a course only requires
 * assignments/quizzes when an admin configures so (later from the Office
 * Portal, spec §23). The values below mirror the schema defaults in
 * models/Course.ts — keep them in sync.
 *
 * COMPLETION REVERSAL (spec §26): if a student already completed the course,
 * adding new lessons later does NOT revoke the completed enrollment. The
 * caller of these functions must check Enrollment.status === COMPLETED first
 * and preserve it — see lib/progress/course.ts `getCourseOverallStatus`.
 */
export const DEFAULT_COMPLETION_CRITERIA: Readonly<ICompletionCriteria> = {
  requireAllLessons: true,
  requireAssignments: false,
  requireAllAssignments: true,
  requireQuizzes: false,
  requireQuizPass: true,
  requireFinalTest: false,
  finalTestPassingPercentage: null,
} as const;

/** Resolves stored-or-default completion criteria for a course. */
export function resolveCompletionCriteria(
  criteria?: ICompletionCriteria | null
): ICompletionCriteria {
  if (!criteria) return { ...DEFAULT_COMPLETION_CRITERIA };
  return {
    requireAllLessons: criteria.requireAllLessons ?? true,
    requireAssignments: criteria.requireAssignments ?? false,
    requireAllAssignments: criteria.requireAllAssignments ?? true,
    requireQuizzes: criteria.requireQuizzes ?? false,
    requireQuizPass: criteria.requireQuizPass ?? true,
    requireFinalTest: criteria.requireFinalTest ?? false,
    finalTestPassingPercentage:
      criteria.finalTestPassingPercentage ?? null,
  };
}

export interface CompletionEvaluationInput {
  lessonProgress: LessonProgressSummary;
  assignmentSummary: AssignmentStatSummary;
  quizSummary: QuizStatSummary;
  criteria: ICompletionCriteria | null | undefined;
  /**
   * True when this evaluation is being computed for an enrollment that is
   * ALREADY marked completed (preserve completion per spec §26).
   */
  enrollmentAlreadyCompleted?: boolean;
}

/** True when the final test passes against its configured threshold. */
function finalTestPassed(
  quizSummary: QuizStatSummary,
  criteria: ICompletionCriteria
): boolean {
  if (!quizSummary.finalTest) return false;
  const bestPercentage = quizSummary.finalTest.bestPercentage;
  if (bestPercentage === null) return false;
  const threshold =
    criteria.finalTestPassingPercentage ?? 0;
  return bestPercentage >= threshold;
}
/**
 * Core completion evaluation (spec §21):
 *
 *   - `lessonRequirementMet`     required lessons completed
 *   - `assignmentRequirementMet` null when assignments are not required,
 *                                otherwise all (or any required) submitted
 *   - `quizRequirementMet`       null when quizzes are not required, otherwise
 *                                every available quiz has a best attempt (and
 *                                it passes when requireQuizPass is set)
 *   - `finalTestRequirementMet`  null when the final test is not required,
 *                                otherwise the best final attempt passes
 *   - `eligibleForCompletion`    every enabled requirement is met
 */
export function calculateCourseCompletionEvaluation(
  input: CompletionEvaluationInput
): CourseCompletionEvaluation {
  const criteria = resolveCompletionCriteria(input.criteria);
  const lessonProgress = input.lessonProgress;
  const assignmentSummary = input.assignmentSummary;
  const quizSummary = input.quizSummary;

  const requirements: CompletionRequirementView[] = [];

  /* ------------------------------ Lessons ------------------------------ */
  const lessonRequirementMet = criteria.requireAllLessons
    ? lessonProgress.percent !== null && lessonProgress.percent === 100
    : lessonProgress.percent === null || lessonProgress.hasContent;
  requirements.push({
    key: "lessons",
    label: "Complete all lessons",
    detail: `${lessonProgress.completedLessons} of ${lessonProgress.totalPublishedLessons} lessons completed`,
    met: lessonRequirementMet,
    enabled: criteria.requireAllLessons,
  });

  /* ---------------------------- Assignments ---------------------------- */
  let assignmentRequirementMet: boolean | null = null;
  if (criteria.requireAssignments) {
    assignmentRequirementMet = criteria.requireAllAssignments
      ? assignmentSummary.totalAssignments > 0 &&
        assignmentSummary.submitted >= assignmentSummary.totalAssignments
      : assignmentSummary.submitted > 0;
  }
  requirements.push({
    key: "assignments",
    label: criteria.requireAllAssignments
      ? "Submit all assignments"
      : "Submit required assignments",
    detail: `${assignmentSummary.submitted} of ${assignmentSummary.totalAssignments} assignments submitted`,
    met: assignmentRequirementMet ?? true,
    enabled: criteria.requireAssignments,
  });

  /* ------------------------------ Quizzes ------------------------------ */
  let quizRequirementMet: boolean | null = null;
  if (criteria.requireQuizzes) {
    const allAttempted =
      quizSummary.availableQuizzes > 0 &&
      quizSummary.attempted >= quizSummary.availableQuizzes;
    quizRequirementMet = allAttempted
      ? criteria.requireQuizPass
        ? quizSummary.passed >= quizSummary.availableQuizzes
        : true
      : false;
  }
  requirements.push({
    key: "quizzes",
    label: criteria.requireQuizPass
      ? "Pass all quizzes"
      : "Attempt all quizzes",
    detail: `${quizSummary.attempted} of ${quizSummary.availableQuizzes} quizzes attempted`,
    met: quizRequirementMet ?? true,
    enabled: criteria.requireQuizzes,
  });

  /* ---------------------------- Final test ----------------------------- */
  let finalTestRequirementMet: boolean | null = null;
  if (criteria.requireFinalTest) {
    finalTestRequirementMet = finalTestPassed(quizSummary, criteria);
  }
  requirements.push({
    key: "final_test",
    label: "Pass final assessment",
    detail: quizSummary.finalTest
      ? quizSummary.finalTest.attempted
        ? `Best score ${quizSummary.finalTest.bestPercentage ?? 0}%`
        : "Not attempted yet"
      : "No final assessment exists",
    met: finalTestRequirementMet ?? true,
    enabled: criteria.requireFinalTest,
  });
const reasonsPending: string[] = [];
  if (!lessonRequirementMet) {
    reasonsPending.push(
      `Complete all lessons (${lessonProgress.completedLessons} of ${lessonProgress.totalPublishedLessons} done).`
    );
  }
  if (assignmentRequirementMet === false) {
    reasonsPending.push(
      `Submit required assignments (${assignmentSummary.submitted} of ${assignmentSummary.totalAssignments} done).`
    );
  }
  if (quizRequirementMet === false) {
    reasonsPending.push(
      criteria.requireQuizPass
        ? `Pass all quizzes (${quizSummary.passed} of ${quizSummary.availableQuizzes}).`
        : `Attempt all quizzes (${quizSummary.attempted} of ${quizSummary.availableQuizzes}).`
    );
  }
  if (finalTestRequirementMet === false) {
    reasonsPending.push("Pass the final assessment.");
  }

  const completionPercentage = lessonProgress.percent;
  const eligibleForCompletion =
    lessonRequirementMet &&
    (assignmentRequirementMet ?? true) &&
    (quizRequirementMet ?? true) &&
    (finalTestRequirementMet ?? true);

  return {
    lessonRequirementMet,
    assignmentRequirementMet,
    quizRequirementMet,
    finalTestRequirementMet,
    eligibleForCompletion,
    completionPercentage,
    reasonsPending,
    requirements: requirements.filter((r) => r.enabled),
    criteria,
  };
}

/**
 * Overall course status (spec §24):
 *
 *   NOT_STARTED        → no lesson progress yet
 *   IN_PROGRESS        → some lessons completed
 *   REQUIREMENTS_PENDING → lessons done but configured criteria unmet
 *   COMPLETED          → all configured criteria satisfied
 *
 * Preservation rule (spec §26): when the enrollment is already completed, the
 * overall status stays COMPLETED even if later content changes would re-open
 * the criteria. Reversal is a deliberate future business decision.
 */
export function deriveOverallStatus(input: {
  learningStatus: CourseLearningStatus;
  evaluation: CourseCompletionEvaluation;
  enrollmentAlreadyCompleted: boolean;
}): "not_started" | "in_progress" | "requirements_pending" | "completed" {
  if (input.enrollmentAlreadyCompleted) return "completed";

  const { learningStatus } = input;

  if (learningStatus === "not_started") return "not_started";

  if (learningStatus === "learning_complete") {
    return input.evaluation.eligibleForCompletion
      ? "completed"
      : "requirements_pending";
  }

  return "in_progress";
}

/**
 * Certificate-readiness foundation (spec §27). ZERO certificate generation —
 * this only reports whether the data currently supports issuing one (Phase 12).
 */
export function buildCertificateReadiness(input: {
  evaluation: CourseCompletionEvaluation;
  enrollmentStatus: string;
  completedAt: string | null;
}): CertificateReadiness {
  const courseCompleted =
    input.enrollmentStatus === "completed" &&
    input.evaluation.eligibleForCompletion;
  return {
    courseCompleted,
    completionDate: courseCompleted ? input.completedAt : null,
    criteriaSatisfied: input.evaluation.eligibleForCompletion,
    certificateReady: courseCompleted,
  };
}

/** Lesson-completion percentage used by completion UIs (safe, spec §40). */
export function lessonCompletionPercentage(
  completedLessons: number,
  totalLessons: number
): number | null {
  const percent = safePercentage(completedLessons, totalLessons);
  return percent === null ? null : Math.round(percent);
}