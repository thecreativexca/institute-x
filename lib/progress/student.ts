import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { ENROLLMENT_STATUSES } from "@/lib/constants";
import type { CourseProgressCard, StudentProgressOverview } from "./types";
import type { BatchRows, CourseComputationContext } from "./data";
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
import { computeLessonProgressSummary } from "./learning";
import { computeAssignmentSummary } from "./assignments";
import { computeQuizSummary } from "./quizzes";
import {
  calculateCourseCompletionEvaluation,
  deriveOverallStatus,
} from "./completion";
import { buildContinueAction } from "./course";

/**
 * Student-wide progress overview (spec §11/§12/§36).
 *
 * Loads every raw row for all of the student's enrollments in a handful of
 * batched $in queries, then computes each course card in memory — no N+1 loops.
 * `getStudentCourseCards` is ALSO the single implementation the dashboard and
 * My Courses reuse so every page shows identical numbers (spec §33–§35).
 */

export interface LoadStudentRowsOptions {
  /** Restrict to specific course ids (used by the learning-page header). */
  courseIds?: Types.ObjectId[];
}

/** Batched load of every row the student's progress surfaces need. */
export async function loadStudentRows(
  studentId: string,
  opts: LoadStudentRowsOptions = {}
): Promise<{
  rows: BatchRows;
  courseIds: Types.ObjectId[];
}> {
  await connectDB();

  const enrollments = await loadEnrollments(
    studentId,
    opts.courseIds ?? null,
    [ENROLLMENT_STATUSES.ACTIVE, ENROLLMENT_STATUSES.COMPLETED]
  );

  const courseIds =
    opts.courseIds ?? enrollments.map((e) => new Types.ObjectId(e.course));
  const uniqueIds = [
    ...new Set(courseIds.map((c) => c.toString())),
  ].map((id) => new Types.ObjectId(id));

  const [
    courses,
    modules,
    lessons,
    progress,
    assignments,
    submissions,
    quizzes,
    attempts,
  ] = await Promise.all([
    loadCourses(uniqueIds),
    loadModules(uniqueIds),
    loadPublishedLessons(uniqueIds),
    loadProgress(studentId, uniqueIds),
    loadAssignments(uniqueIds),
    loadSubmissions(studentId, uniqueIds),
    loadQuizzes(uniqueIds),
    loadQuizAttempts(studentId, uniqueIds),
  ]);

  const rows: BatchRows = {
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

  return { rows, courseIds: uniqueIds };
}

/** Builds contexts for every enrollment course (skips courses that vanished). */
export function buildCourseContexts(
  rows: BatchRows
): CourseComputationContext[] {
  return rows.enrollments
    .map((e) => buildCourseContext(rows, e.course))
    .filter((ctx) => ctx.courseId && rows.courses.has(ctx.courseId));
}
/** One course card — reused by dashboard, My Courses and the progress page. */
export function computeCourseCard(
  ctx: CourseComputationContext
): CourseProgressCard {
  const lessonProgress = computeLessonProgressSummary({
    lessons: ctx.lessons,
    progressByLessonId: ctx.progressByLessonId,
    moduleOrder: ctx.moduleOrder,
    moduleTitles: ctx.moduleTitles,
    courseId: ctx.courseId,
  });
  const assignmentSummary = computeAssignmentSummary({
    assignments: ctx.assignments,
    submissionsByAssignmentId: ctx.submissionsByAssignmentId,
  });
  const quizSummary = computeQuizSummary({
    quizzes: ctx.quizzes,
    attemptsByQuizId: ctx.attemptsByQuizId,
  });

  const enrollmentAlreadyCompleted =
    ctx.enrollment?.status === ENROLLMENT_STATUSES.COMPLETED;

  const evaluation = calculateCourseCompletionEvaluation({
    lessonProgress,
    assignmentSummary,
    quizSummary,
    criteria: ctx.criteria,
    enrollmentAlreadyCompleted,
  });

  const status = deriveOverallStatus({
    learningStatus: lessonProgress.learningStatus,
    evaluation,
    enrollmentAlreadyCompleted,
  });

  return {
    courseId: ctx.courseId,
    courseName: ctx.courseTitle,
    courseSlug: ctx.courseSlug,
    categoryName: ctx.categoryName,
    thumbnailUrl: ctx.thumbnailUrl,
    level: ctx.level,
    progressPercent: lessonProgress.percent,
    completedLessons: lessonProgress.completedLessons,
    totalLessons: lessonProgress.totalPublishedLessons,
    hasContent: lessonProgress.hasContent,
    status,
    learningStatus: lessonProgress.learningStatus,
    lastActivity: lessonProgress.lastAccessedLesson
      ? {
          lessonTitle: lessonProgress.lastAccessedLesson.title,
          moduleTitle: lessonProgress.lastAccessedLesson.moduleTitle,
          accessedAt: lessonProgress.lastAccessedLesson.accessedAt,
        }
      : null,
    continueLearning: buildContinueAction(ctx),
    enrollmentStatus: ctx.enrollment?.status ?? "",
    completedAt: ctx.enrollment?.completedAt ?? null,
  };
}
/** Top-level student progress overview for `/student/progress`. */
export async function getStudentProgressOverview(
  studentId: string
): Promise<StudentProgressOverview> {
  const { rows } = await loadStudentRows(studentId);
  const contexts = buildCourseContexts(rows);
  const cards = sortCourseCards(contexts.map((ctx) => computeCourseCard(ctx)));

  let coursesStarted = 0;
  let learningCompleted = 0;
  let lessonsCompleted = 0;
  let totalPublishedLessons = 0;

  for (const card of cards) {
    lessonsCompleted += card.completedLessons;
    totalPublishedLessons += card.totalLessons;
    if (card.learningStatus !== "not_started") coursesStarted += 1;
    if (card.learningStatus === "learning_complete") learningCompleted += 1;
  }

  return {
    enrolledCourses: cards.length,
    coursesStarted,
    learningCompleted,
    lessonsCompleted,
    totalPublishedLessons,
    courses: cards,
  };
}

/** Cards for the dashboard / My Courses pages (single shared implementation). */
export async function getStudentCourseCards(
  studentId: string
): Promise<CourseProgressCard[]> {
  const { rows } = await loadStudentRows(studentId);
  const contexts = buildCourseContexts(rows);
  return sortCourseCards(contexts.map((ctx) => computeCourseCard(ctx)));
}

/** Lesson progress for ONE course — single source for the learning page header. */
export async function getLessonProgressForStudent(
  studentId: string,
  courseId: string
) {
  const { rows } = await loadStudentRows(studentId, {
    courseIds: [new Types.ObjectId(courseId)],
  });
  const ctx = buildCourseContext(rows, courseId);
  return computeLessonProgressSummary({
    lessons: ctx.lessons,
    progressByLessonId: ctx.progressByLessonId,
    moduleOrder: ctx.moduleOrder,
    moduleTitles: ctx.moduleTitles,
    courseId,
  });
}

/** Sort order: in-progress first, then requirements-pending, not-started, completed. */
export function sortCourseCards(
  cards: CourseProgressCard[]
): CourseProgressCard[] {
  const order: Record<CourseProgressCard["status"], number> = {
    in_progress: 0,
    requirements_pending: 1,
    not_started: 2,
    completed: 3,
  };
  return [...cards].sort((a, b) => order[a.status] - order[b.status]);
}