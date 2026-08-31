import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { ENROLLMENT_STATUSES } from "@/lib/constants";
import { Enrollment } from "@/models/Enrollment";
import type {
  ContinueLearningAction,
  CourseProgressDetailView,
  CourseProgressHeader,
  LessonProgressSummary,
  RecentActivityItem,
} from "./types";
import type { CourseComputationContext, BatchRows } from "./data";
import {
  buildCourseContext,
  loadAssignments,
  loadCourses,
  loadEnrollments,
  loadModules,
  loadProgress,
  loadPublishedLessons,
  loadQuizAttempts,
  loadQuizzes,
  loadSubmissions,
} from "./data";
import {
  buildContinueLearning,
  computeLessonProgressSummary,
  computeModuleProgressViews,
  buildLessonActivity,
  type ProgressRow,
} from "./learning";
import { computeAssignmentSummary } from "./assignments";
import { computeQuizSummary } from "./quizzes";
import {
  buildCertificateReadiness,
  calculateCourseCompletionEvaluation,
  deriveOverallStatus,
} from "./completion";

/**
 * Course-scoped progress computation (spec Â§21, Â§36, Â§38).
 *
 * All functions here derive every number from REAL stored records (Progress,
 * Submission, QuizAttempt, Enrollment) â€” never fabricated percentages â€” and
 * always build on the caller-provided student identity (no client-supplied
 * studentId is ever trusted inside these services).
 */

/** Full batched load for a single course â€” no N+1 (spec Â§36). */
export async function loadCourseBatch(
  studentId: string,
  courseId: string
): Promise<BatchRows> {
  const courseObjectId = new Types.ObjectId(courseId);

  const [
    courses,
    enrollments,
    modules,
    lessons,
    progress,
    assignments,
    submissions,
    quizzes,
    attempts,
  ] = await Promise.all([
    loadCourses([courseObjectId]),
    loadEnrollments(studentId, [courseObjectId], [
      ENROLLMENT_STATUSES.ACTIVE,
      ENROLLMENT_STATUSES.COMPLETED,
      ENROLLMENT_STATUSES.PENDING,
      ENROLLMENT_STATUSES.EXPIRED,
    ]),
    loadModules([courseObjectId]),
    loadPublishedLessons([courseObjectId]),
    loadProgress(studentId, [courseObjectId]),
    loadAssignments([courseObjectId]),
    loadSubmissions(studentId, [courseObjectId]),
    loadQuizzes([courseObjectId]),
    loadQuizAttempts(studentId, [courseObjectId]),
  ]);

  return {
    enrollments,
    courses,
    modules,
    lessons,
    progress,
    assignments,
    submissions,
    quizzes,
    attempts,
  };
}

/** Lesson progress summary â€” the single source of truth for every surface. */
export function computeLessonProgress(
  ctx: CourseComputationContext
): LessonProgressSummary {
  return computeLessonProgressSummary({
    lessons: ctx.lessons,
    progressByLessonId: ctx.progressByLessonId,
    moduleOrder: ctx.moduleOrder,
    moduleTitles: ctx.moduleTitles,
    courseId: ctx.courseId,
  });
}

/** Assignment performance for one course (published assignments only). */
export function computeAssignments(ctx: CourseComputationContext) {
  return computeAssignmentSummary({
    assignments: ctx.assignments,
    submissionsByAssignmentId: ctx.submissionsByAssignmentId,
  });
}

/** Quiz performance for one course (best-attempt policy, spec Â§19). */
export function computeQuizzes(ctx: CourseComputationContext) {
  return computeQuizSummary({
    quizzes: ctx.quizzes,
    attemptsByQuizId: ctx.attemptsByQuizId,
  });
}

/** Assembles the full course detail used by `/student/progress/[courseId]`. */
export function assembleCourseDetail(
  ctx: CourseComputationContext
): CourseProgressDetailView {
  const lessonProgress = computeLessonProgress(ctx);
  const assignmentSummary = computeAssignments(ctx);
  const quizSummary = computeQuizzes(ctx);

  const enrollmentAlreadyCompleted =
    ctx.enrollment?.status === ENROLLMENT_STATUSES.COMPLETED;

  const evaluation = calculateCourseCompletionEvaluation({
    lessonProgress,
    assignmentSummary,
    quizSummary,
    criteria: ctx.criteria,
    enrollmentAlreadyCompleted,
  });

  const overallStatus = deriveOverallStatus({
    learningStatus: lessonProgress.learningStatus,
    evaluation,
    enrollmentAlreadyCompleted,
  });

  const certificateReadiness = buildCertificateReadiness({
    evaluation,
    enrollmentStatus: ctx.enrollment?.status ?? ENROLLMENT_STATUSES.PENDING,
    completedAt: ctx.enrollment?.completedAt ?? null,
  });

  const header: CourseProgressHeader = {
    courseId: ctx.courseId,
    courseName: ctx.courseTitle,
    courseSlug: ctx.courseSlug,
    categoryName: ctx.categoryName,
    thumbnailUrl: ctx.thumbnailUrl,
    level: ctx.level,
    enrolledAt: ctx.enrollment?.enrolledAt ?? new Date(0).toISOString(),
    enrollmentStatus: ctx.enrollment?.status ?? ENROLLMENT_STATUSES.PENDING,
    learningStatus: lessonProgress.learningStatus,
    overallStatus,
    hasContent: lessonProgress.hasContent,
    lessonProgress,
    assignmentSummary,
    quizSummary,
  };

  const modules = computeModuleProgressViews({
    modules: ctx.modules,
    lessons: ctx.lessons,
    progressByLessonId: ctx.progressByLessonId,
  });

  const recentActivity = buildRecentActivity(ctx, lessonProgress);

  return {
    header,
    modules,
    completion: evaluation,
    certificateReadiness,
    recentActivity,
  };
}

/** Recent learning milestones from REAL stored timestamps only (spec Â§31/Â§32). */
export function buildRecentActivity(
  ctx: CourseComputationContext,
  lessonProgress: LessonProgressSummary
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  // Course started = enrollment date.
  if (ctx.enrollment?.enrolledAt) {
    items.push({
      type: "course_started",
      label: "Course started",
      detail: ctx.courseTitle,
      at: ctx.enrollment.enrolledAt,
    });
  }

  // Lesson views + completions.
  const lessonActivity = buildLessonActivity(
    ctx.lessons,
    ctx.progressByLessonId,
    ctx.moduleTitles,
    10
  );
  for (const a of lessonActivity) {
    items.push({
      type: a.type,
      label: a.label,
      detail: a.detail,
      at: a.at,
    });
  }

  // Module completions: derived when every published lesson is complete.
  for (const moduleDoc of ctx.modules) {
    const moduleLessons = ctx.lessons.filter((l) => l.moduleId === moduleDoc._id);
    if (moduleLessons.length === 0) continue;
    const completedAll = moduleLessons.every((l) =>
      isCompletedRow(ctx.progressByLessonId.get(l._id))
    );
    if (!completedAll) continue;
    const latestCompletion = moduleLessons
      .map((l) => ctx.progressByLessonId.get(l._id)?.completedAt)
      .filter((t): t is string => !!t)
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
    if (latestCompletion) {
      items.push({
        type: "module_completed",
        label: moduleDoc.title,
        detail: "Module completed",
        at: latestCompletion,
      });
    }
  }

  // Assignment submissions (real submittedAt).
  for (const [assignmentId, sub] of ctx.submissionsByAssignmentId) {
    const assignment = ctx.assignments.find((a) => a._id === assignmentId);
    if (!assignment) continue;
    if (sub.submittedAt) {
      items.push({
        type: "assignment_submitted",
        label: assignment.title,
        detail: "Assignment submitted",
        at: sub.submittedAt,
      });
    }
  }

  // Quiz passed â€” one entry per quiz using the best passed attempt.
  for (const quiz of ctx.quizzes) {
    const attempts = ctx.attemptsByQuizId.get(quiz._id) ?? [];
    const bestPassed = attempts
      .filter((a) => a.passed)
      .sort(
        (a, b) =>
          Date.parse(b.submittedAt ?? b.createdAt) -
          Date.parse(a.submittedAt ?? a.createdAt)
      )[0];
    if (bestPassed && bestPassed.submittedAt) {
      items.push({
        type: "quiz_passed",
        label: quiz.title,
        detail: "Quiz passed",
        at: bestPassed.submittedAt,
      });
    }
  }

  // Course completed (enrollment completionDate â€” server timestamp).
  if (
    ctx.enrollment?.status === ENROLLMENT_STATUSES.COMPLETED &&
    ctx.enrollment.completedAt
  ) {
    items.push({
      type: "course_completed",
      label: ctx.courseTitle,
      detail: "Course completed",
      at: ctx.enrollment.completedAt,
    });
  }

  const seen = new Set<string>();
  const unique = items.filter((i) => {
    const key = `${i.type}:${i.label}:${i.at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, 15);
}

function isCompletedRow(row: ProgressRow | undefined): boolean {
  return !!row && row.status === "completed";
}

/** Next lesson link for CTAs (spec §15) — shared across all surfaces. */
export function buildContinueAction(
  ctx: CourseComputationContext
): ContinueLearningAction | null {
  const action = buildContinueLearning(
    ctx.lessons,
    ctx.progressByLessonId,
    ctx.moduleOrder,
    ctx.moduleTitles
  );
  if (!action) return null;
  return {
    ...action,
    href: `/student/courses/${ctx.courseId}/lessons/${action.lessonId}`,
  };
}

/**
 * Writes the COMPLETED state to the enrollment idempotently when the
 * centralized criteria are satisfied (spec Â§25):
 *   - status â†’ COMPLETED
 *   - completedAt â†’ server timestamp, never overwritten once set
 *
 * Idempotency: already-completed enrollments return early and the atomic
 * `updateOne({ status: ACTIVE })` guard means concurrent evaluations can only
 * flip the transition once (the original completionDate is preserved).
 */
export async function completeEnrollmentIfEligible(
  studentId: string,
  courseId: string
): Promise<{
  completed: boolean;
  alreadyCompleted: boolean;
  completionDate: string | null;
}> {
  await connectDB();

  const studentObjectId = new Types.ObjectId(studentId);
  const courseObjectId = new Types.ObjectId(courseId);

  const enrollment = await Enrollment.findOne({
    student: studentObjectId,
    course: courseObjectId,
    status: {
      $in: [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED],
    },
  })
    .select("_id status completedAt")
    .lean();

  if (!enrollment) {
    return { completed: false, alreadyCompleted: false, completionDate: null };
  }

  if (enrollment.status === ENROLLMENT_STATUSES.COMPLETED) {
    return {
      completed: true,
      alreadyCompleted: true,
      completionDate:
        enrollment.completedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  const rows = await loadCourseBatch(studentId, courseId);
  const ctx = buildCourseContext(rows, courseId);
  const lessonProgress = computeLessonProgress(ctx);
  const assignmentSummary = computeAssignments(ctx);
  const quizSummary = computeQuizzes(ctx);
  const evaluation = calculateCourseCompletionEvaluation({
    lessonProgress,
    assignmentSummary,
    quizSummary,
    criteria: ctx.criteria,
    enrollmentAlreadyCompleted: false,
  });

  if (!evaluation.eligibleForCompletion) {
    return { completed: false, alreadyCompleted: false, completionDate: null };
  }

  const now = new Date();
  const result = await Enrollment.updateOne(
    {
      _id: enrollment._id,
      status: ENROLLMENT_STATUSES.ACTIVE,
    },
    {
      $set: {
        status: ENROLLMENT_STATUSES.COMPLETED,
        completedAt: now,
      },
    }
  );

  return {
    completed: result.modifiedCount > 0,
    alreadyCompleted: false,
    completionDate: result.modifiedCount > 0 ? now.toISOString() : null,
  };
}

