import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import {
  QUIZ_ATTEMPT_STATUSES,
  PROGRESS_STATUSES,
  SUBMISSION_STATUSES,
} from "@/lib/constants";
import { Course, type ICourse, type ICompletionCriteria } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { Progress } from "@/models/Progress";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import type { ProgressRow } from "./learning";
import type { AssignmentRow, SubmissionRow } from "./assignments";
import type { QuizRow, AttemptRow } from "./quizzes";

/**
 * Batched, projection-limited reads for the progress system (spec §36).
 *
 * All "my progress for many courses" surfaces load their raw rows with $in
 * queries and assemble context maps in memory — no per-course N+1 loops, no
 * `populate` chains that pull complete documents.
 *
 * Every id is converted to a plain string and only the fields the pure
 * calculation layer needs are selected.
 */

export type { ProgressRow };

/* ------------------------------- Row shapes -------------------------------- */

/** Raw row: one enrollment (student is implicit from the caller). */
export interface EnrollmentRow {
  _id: string;
  course: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
}

/** Raw row: a course (projection-limited). */
export interface CourseRow {
  _id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  level: string;
  thumbnailUrl: string | null;
  status: string;
  criteria: ICompletionCriteria | null | undefined;
}

/** Raw row: one progress record (strings, minimal fields). */
export interface ProgressDbRow extends ProgressRow {
  course: string;
  lesson: string;
}

/** Raw row: a published assignment. */
export interface AssignmentDbRow extends AssignmentRow {
  course: string;
}

/** Raw row: a submission. */
export interface SubmissionDbRow extends Omit<SubmissionRow, "assignmentId"> {
  course: string;
  assignment: string;
}

/** Raw row: a published quiz. */
export interface QuizDbRow extends QuizRow {
  course: string;
}

/** Raw row: one quiz attempt (strings). */
export interface AttemptDbRow extends Omit<AttemptRow, "quizId"> {
  course: string;
  quiz: string;
}

/** Raw row: a published lesson (strings). */
export interface LessonDbRow {
  _id: string;
  course: string;
  module: string;
  title: string;
  sortOrder: number;
}

/** Raw row: a module. */
export interface ModuleDbRow {
  _id: string;
  course: string;
  title: string;
  description: string | null;
  sortOrder: number;
}

/** All batched raw rows for one (or many) enrollments. */
export interface BatchRows {
  enrollments: EnrollmentRow[];
  courses: Map<string, CourseRow>;
  modules: ModuleDbRow[];
  lessons: LessonDbRow[];
  progress: ProgressDbRow[];
  assignments: AssignmentDbRow[];
  submissions: SubmissionDbRow[];
  quizzes: QuizDbRow[];
  attempts: AttemptDbRow[];
}

/* ------------------------------ Loaders ------------------------------------ */

/** Courses belonging to the given ids (deliberately includes archived). */
export async function loadCourses(
  courseIds: Types.ObjectId[]
): Promise<Map<string, CourseRow>> {
  if (courseIds.length === 0) return new Map();
  const docs = (await Course.find({ _id: { $in: courseIds } })
    .select("name slug category level thumbnailUrl status completionCriteria")
    .populate<{ category: { _id: Types.ObjectId; name: string } | null }>(
      "category",
      "name"
    )
    .lean()) as unknown as Array<
    ICourse & { category: { _id: Types.ObjectId; name: string } | null }
  >;

  const map = new Map<string, CourseRow>();
  for (const doc of docs) {
    map.set(doc._id.toString(), {
      _id: doc._id.toString(),
      name: doc.name,
      slug: doc.slug,
      categoryName:
        doc.category && typeof doc.category === "object" && "name" in doc.category
          ? doc.category.name
          : null,
      level: doc.level,
      thumbnailUrl: doc.thumbnailUrl ?? null,
      status: doc.status,
      criteria: doc.completionCriteria ?? undefined,
    });
  }
  return map;
}

export async function loadEnrollments(
  studentId: string,
  courseIds: Types.ObjectId[] | null,
  statuses: string[]
): Promise<EnrollmentRow[]> {
  const filter: Record<string, unknown> = {
    student: toObj(studentId),
    status: { $in: statuses },
  };
  if (courseIds && courseIds.length > 0) {
    filter.course = { $in: courseIds };
  }
  const docs = await Enrollment.find(filter)
    .select("course status enrolledAt completedAt")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    status: string;
    enrolledAt: Date;
    completedAt?: Date | null;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    status: d.status,
    enrolledAt: d.enrolledAt.toISOString(),
    completedAt: d.completedAt?.toISOString() ?? null,
  }));
}

export async function loadModules(
  courseIds: Types.ObjectId[]
): Promise<ModuleDbRow[]> {
  if (courseIds.length === 0) return [];
  const docs = await Module.find({ course: { $in: courseIds } })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("course title description sortOrder")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    title: string;
    description?: string | null;
    sortOrder: number;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    title: d.title,
    description: d.description ?? null,
    sortOrder: d.sortOrder,
  }));
}

export async function loadPublishedLessons(
  courseIds: Types.ObjectId[]
): Promise<LessonDbRow[]> {
  if (courseIds.length === 0) return [];
  const docs = await Lesson.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .select("course module title sortOrder")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    module: Types.ObjectId;
    title: string;
    sortOrder: number;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    module: d.module.toString(),
    title: d.title,
    sortOrder: d.sortOrder,
  }));
}

export async function loadProgress(
  studentId: string,
  courseIds: Types.ObjectId[]
): Promise<ProgressDbRow[]> {
  const filter: Record<string, unknown> = { student: toObj(studentId) };
  if (courseIds.length > 0) {
    filter.course = { $in: courseIds };
  }
  const docs = await Progress.find(filter)
    .select("course lesson status completedAt lastViewedAt updatedAt")
    .lean();
  return (docs as unknown as Array<{
    course: Types.ObjectId;
    lesson: Types.ObjectId;
    status: string;
    completedAt?: Date | null;
    lastViewedAt?: Date | null;
    updatedAt: Date;
  }>).map((d) => ({
    course: d.course.toString(),
    lesson: d.lesson.toString(),
    status:
      d.status === PROGRESS_STATUSES.COMPLETED
        ? PROGRESS_STATUSES.COMPLETED
        : d.status === PROGRESS_STATUSES.IN_PROGRESS
          ? PROGRESS_STATUSES.IN_PROGRESS
          : PROGRESS_STATUSES.NOT_STARTED,
    completedAt: d.completedAt?.toISOString() ?? null,
    lastViewedAt: d.lastViewedAt?.toISOString() ?? null,
    updatedAt: d.updatedAt.toISOString(),
  }));
}

export async function loadAssignments(
  courseIds: Types.ObjectId[]
): Promise<AssignmentDbRow[]> {
  if (courseIds.length === 0) return [];
  const docs = await Assignment.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .select("course title maxScore dueAt")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    title: string;
    maxScore: number;
    dueAt?: Date | null;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    title: d.title,
    maxScore: d.maxScore,
    dueAt: d.dueAt?.toISOString() ?? null,
  }));
}

export async function loadSubmissions(
  studentId: string,
  courseIds: Types.ObjectId[]
): Promise<SubmissionDbRow[]> {
  const filter: Record<string, unknown> = { student: toObj(studentId) };
  if (courseIds.length > 0) {
    filter.course = { $in: courseIds };
  }
  // Latest submission wins per assignment — newest first, dedupe in builder.
  const docs = await Submission.find(filter)
    .sort({ submittedAt: -1 })
    .select("course assignment status score totalMarks submittedAt gradedAt")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    assignment: Types.ObjectId;
    status: string;
    score?: number | null;
    totalMarks?: number | null;
    submittedAt: Date;
    gradedAt?: Date | null;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    assignment: d.assignment.toString(),
    status:
      d.status === SUBMISSION_STATUSES.GRADED
        ? SUBMISSION_STATUSES.GRADED
        : SUBMISSION_STATUSES.SUBMITTED,
    score: d.score ?? null,
    totalMarks: d.totalMarks ?? null,
    submittedAt: d.submittedAt.toISOString(),
    gradedAt: d.gradedAt?.toISOString() ?? null,
  }));
}

export async function loadQuizzes(
  courseIds: Types.ObjectId[]
): Promise<QuizDbRow[]> {
  if (courseIds.length === 0) return [];
  const docs = await Quiz.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .select("course title type passingPercentage")
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    course: Types.ObjectId;
    title: string;
    type: string;
    passingPercentage: number;
  }>).map((d) => ({
    _id: d._id.toString(),
    course: d.course.toString(),
    title: d.title,
    type: d.type,
    passingPercentage: d.passingPercentage,
  }));
}

export async function loadQuizAttempts(
  studentId: string,
  courseIds: Types.ObjectId[]
): Promise<AttemptDbRow[]> {
  const filter: Record<string, unknown> = { student: toObj(studentId) };
  if (courseIds.length > 0) {
    filter.course = { $in: courseIds };
  }
  const docs = await QuizAttempt.find(filter)
    .select(
      "quiz course attemptNumber status score totalMarks percentage passed submittedAt createdAt"
    )
    .lean();
  return (docs as unknown as Array<{
    _id: Types.ObjectId;
    quiz: Types.ObjectId;
    course: Types.ObjectId;
    attemptNumber: number;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    submittedAt?: Date | null;
    createdAt: Date;
  }>).map((d) => ({
    _id: d._id.toString(),
    quiz: d.quiz.toString(),
    course: d.course.toString(),
    attemptNumber: d.attemptNumber,
    status:
      d.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
        ? QUIZ_ATTEMPT_STATUSES.EXPIRED
        : d.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED
          ? QUIZ_ATTEMPT_STATUSES.SUBMITTED
          : QUIZ_ATTEMPT_STATUSES.IN_PROGRESS,
    score: d.score,
    totalMarks: d.totalMarks,
    percentage: d.percentage,
    passed: d.passed,
    submittedAt: d.submittedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  }));
}

function toObj(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/**
 * Assembles the per-course computation context from the batched rows.
 * Returns a single CourseComputationContext with the plain Maps the pure
 * functions consume directly.
 */
export interface CourseComputationContext {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  categoryName: string | null;
  thumbnailUrl: string | null;
  level: string;
  courseStatus: string;
  criteria: ICompletionCriteria | null | undefined;
  enrollment: EnrollmentRow | null;
  modules: Array<{
    _id: string;
    title: string;
    description: string | null;
    sortOrder: number;
  }>;
  lessons: Array<{
    _id: string;
    title: string;
    moduleId: string;
    sortOrder: number;
  }>;
  progressByLessonId: Map<string, ProgressRow>;
  moduleOrder: Map<string, number>;
  moduleTitles: Map<string, string | null>;
  assignments: AssignmentRow[];
  submissionsByAssignmentId: Map<string, SubmissionRow>;
  quizzes: QuizRow[];
  attemptsByQuizId: Map<string, AttemptRow[]>;
}

export function buildCourseContext(
  rows: BatchRows,
  courseId: string
): CourseComputationContext {
  const course = rows.courses.get(courseId);
  const moduleOrder = new Map<string, number>();
  const moduleTitles = new Map<string, string | null>();

  for (const m of rows.modules) {
    moduleOrder.set(m._id, m.sortOrder);
    moduleTitles.set(m._id, m.title);
  }

  const lessons = rows.lessons
    .filter((l) => l.course === courseId)
    .map((l) => ({
      _id: l._id,
      title: l.title,
      moduleId: l.module,
      sortOrder: l.sortOrder,
    }));

  const progress = rows.progress.filter((p) => p.course === courseId);
  const progressByLessonId = new Map<string, ProgressRow>();
  for (const p of progress) {
    progressByLessonId.set(p.lesson, {
      status: p.status,
      completedAt: p.completedAt,
      lastViewedAt: p.lastViewedAt,
      updatedAt: p.updatedAt,
    });
  }

  const assignments = rows.assignments
    .filter((a) => a.course === courseId)
    .map((a) => ({
      _id: a._id,
      title: a.title,
      maxScore: a.maxScore,
      dueAt: a.dueAt,
    }));

  const submissionsByAssignmentId = new Map<string, SubmissionRow>();
  for (const s of rows.submissions.filter((s) => s.course === courseId)) {
    // Loader already sorted newest-first; first occurrence is the latest.
    if (!submissionsByAssignmentId.has(s.assignment)) {
      submissionsByAssignmentId.set(s.assignment, {
        assignmentId: s.assignment,
        status: s.status,
        score: s.score,
        totalMarks: s.totalMarks,
        submittedAt: s.submittedAt,
        gradedAt: s.gradedAt,
      });
    }
  }

  const quizzes = rows.quizzes
    .filter((q) => q.course === courseId)
    .map((q) => ({
      _id: q._id,
      title: q.title,
      type: q.type,
      passingPercentage: q.passingPercentage,
    }));

  const attemptsByQuizId = new Map<string, AttemptRow[]>();
  for (const a of rows.attempts.filter((a) => a.course === courseId)) {
    const list = attemptsByQuizId.get(a.quiz) ?? [];
    list.push({
      _id: a._id,
      quizId: a.quiz,
      attemptNumber: a.attemptNumber,
      status: a.status,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      passed: a.passed,
      submittedAt: a.submittedAt,
      createdAt: a.createdAt,
    });
    attemptsByQuizId.set(a.quiz, list);
  }

  const enrollment =
    rows.enrollments.find((e) => e.course === courseId) ?? null;

  return {
    courseId,
    courseTitle: course?.name ?? "Course",
    courseSlug: course?.slug ?? "",
    categoryName: course?.categoryName ?? null,
    thumbnailUrl: course?.thumbnailUrl ?? null,
    level: course?.level ?? "beginner",
    courseStatus: course?.status ?? "archived",
    criteria: course?.criteria,
    enrollment,
    modules: rows.modules
      .filter((m) => m.course === courseId)
      .map((m) => ({
        _id: m._id,
        title: m.title,
        description: m.description,
        sortOrder: m.sortOrder,
      })),
    lessons,
    progressByLessonId,
    moduleOrder,
    moduleTitles,
    assignments,
    submissionsByAssignmentId,
    quizzes,
    attemptsByQuizId,
  };
}