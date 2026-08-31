import type {
  ContinueLearningAction,
  CourseLearningStatus,
  LastAccessedLesson,
  LessonProgressLine,
  LessonProgressSummary,
  ModuleProgressView,
  ModuleStatus,
} from "./types";
import { safePercentage } from "./percentages";

/**
 * Pure lesson/module progress calculations (spec §5–§15).
 *
 * These functions never touch the database — they consume plain row shapes and
 * produce the exact DTOs used across the dashboard, My Courses, the learning
 * page and the progress pages, so every surface shows the same number for the
 * same course (spec §35).
 *
 * Status strings mirror `lib/constants` (PROGRESS_STATUSES); they are written
 * as literals here so this module stays dependency-free and Node-testable.
 */

/** One published lesson row (string ids, plain JSON). */
export interface LessonRow {
  _id: string;
  title: string;
  moduleId: string;
  sortOrder: number;
}

/** One module row used for ordering/headers. */
export interface ModuleRow {
  _id: string;
  title: string;
  description?: string | null;
  sortOrder: number;
}

/** One progress record (keyed by lesson id in the computation helpers). */
export interface ProgressRow {
  status: string;
  completedAt?: string | null;
  lastViewedAt?: string | null;
  updatedAt?: string | null;
}

const COMPLETED = "completed";
const IN_PROGRESS = "in_progress";
const NOT_STARTED = "not_started";

/** Derives a module status from its completed/total published lessons. */
export function deriveModuleStatus(
  completedLessons: number,
  totalLessons: number
): ModuleStatus {
  if (totalLessons <= 0) return NOT_STARTED;
  if (completedLessons >= totalLessons) return "completed";
  if (completedLessons > 0) return IN_PROGRESS;
  return NOT_STARTED;
}

/** Derives the lesson-based course learning status (spec §9). */
export function deriveCourseLearningStatus(
  completedLessons: number,
  totalLessons: number
): CourseLearningStatus {
  if (totalLessons <= 0) return NOT_STARTED;
  if (completedLessons >= totalLessons) return "learning_complete";
  if (completedLessons > 0) return IN_PROGRESS;
  return NOT_STARTED;
}
/** Sorts published lessons by (module order, lesson sortOrder, id). */
export function sortLessonsForLearning(
  lessons: LessonRow[],
  moduleOrder: ReadonlyMap<string, number>
): LessonRow[] {
  return [...lessons].sort((a, b) => {
    const ma = moduleOrder.get(a.moduleId) ?? Number.MAX_SAFE_INTEGER;
    const mb = moduleOrder.get(b.moduleId) ?? Number.MAX_SAFE_INTEGER;
    if (ma !== mb) return ma - mb;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a._id.localeCompare(b._id);
  });
}

/** True when the record represents a completed lesson. */
export function isCompletedRow(row: ProgressRow | undefined): boolean {
  return !!row && row.status === COMPLETED;
}

/**
 * Last accessed published lesson — a real Progress record sorted by its most
 * recent activity timestamp. Returns null when the student has never viewed
 * any published lesson.
 */
export function findLastAccessedLesson(
  lessons: LessonRow[],
  progressByLessonId: ReadonlyMap<string, ProgressRow>,
  moduleTitles: ReadonlyMap<string, string | null>
): LastAccessedLesson | null {
  const lessonById = new Map(lessons.map((l) => [l._id, l]));
  const candidates: Array<{
    lesson: LessonRow;
    at: number;
  }> = [];

  for (const [lessonId, row] of progressByLessonId) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) continue; // progress for a deleted/unpublished lesson → skip
    const ts =
      row.lastViewedAt ?? row.updatedAt ?? row.completedAt ?? undefined;
    if (!ts) continue;
    const time = Date.parse(ts);
    if (!Number.isFinite(time)) continue;
    candidates.push({ lesson, at: time });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.at - a.at);
  const best = candidates[0];
  return {
    lessonId: best.lesson._id,
    title: best.lesson.title,
    moduleId: best.lesson.moduleId,
    moduleTitle: moduleTitles.get(best.lesson.moduleId) ?? null,
    accessedAt: new Date(best.at).toISOString(),
  };
}

/**
 * Next lesson to learn (spec §15):
 *   - the last accessed published lesson when the student has started
 *   - otherwise the first published lesson in curriculum order
 *   - null when there is no published content (CTA disabled/hidden)
 */
export function buildContinueLearning(
  lessons: LessonRow[],
  progressByLessonId: ReadonlyMap<string, ProgressRow>,
  moduleOrder: ReadonlyMap<string, number>,
  moduleTitles: ReadonlyMap<string, string | null>
): Omit<ContinueLearningAction, "href"> | null {
  if (lessons.length === 0) return null;

  const last = findLastAccessedLesson(
    lessons,
    progressByLessonId,
    moduleTitles
  );
  if (last) {
    return {
      lessonId: last.lessonId,
      lessonTitle: last.title,
      isResume: true,
    };
  }

  const sorted = sortLessonsForLearning(lessons, moduleOrder);
  const first = sorted[0];
  return {
    lessonId: first._id,
    lessonTitle: first.title,
    isResume: false,
  };
}
/**
 * Lesson progress summary for one course (spec §5/§6):
 * `completed published lessons / total published lessons × 100`.
 */
export function computeLessonProgressSummary(input: {
  lessons: LessonRow[];
  progressByLessonId: ReadonlyMap<string, ProgressRow>;
  moduleOrder: ReadonlyMap<string, number>;
  moduleTitles: ReadonlyMap<string, string | null>;
  courseId: string;
}): LessonProgressSummary {
  const { lessons, progressByLessonId } = input;
  const totalPublishedLessons = lessons.length;
  const completedLessons = lessons.filter((l) =>
    isCompletedRow(progressByLessonId.get(l._id))
  ).length;

  const percent = safePercentage(completedLessons, totalPublishedLessons);
  const hasContent = totalPublishedLessons > 0;
  const learningStatus = deriveCourseLearningStatus(
    completedLessons,
    totalPublishedLessons
  );

  const continueLearning = buildContinueLearning(
    lessons,
    progressByLessonId,
    input.moduleOrder,
    input.moduleTitles
  );

  return {
    totalPublishedLessons,
    completedLessons,
    percent: percent === null ? null : Math.round(percent),
    hasContent,
    learningStatus,
    lastAccessedLesson: findLastAccessedLesson(
      lessons,
      progressByLessonId,
      input.moduleTitles
    ),
    continueLearning:
      continueLearning === null
        ? null
        : {
            ...continueLearning,
            href: `/student/courses/${input.courseId}/lessons/${continueLearning.lessonId}`,
          },
  };
}
/**
 * Per-module progress for a course, in curriculum order. Modules with zero
 * published lessons still render with `hasContent: false` and a null percent
 * so the UI can show an honest "no lessons yet" state instead of a fake 0%.
 */
export function computeModuleProgressViews(input: {
  modules: ModuleRow[];
  lessons: LessonRow[];
  progressByLessonId: ReadonlyMap<string, ProgressRow>;
}): ModuleProgressView[] {
  const lessonRowsByModule = new Map<string, LessonRow[]>();
  for (const lesson of input.lessons) {
    const list = lessonRowsByModule.get(lesson.moduleId) ?? [];
    list.push(lesson);
    lessonRowsByModule.set(lesson.moduleId, list);
  }

  const orderedModules = [...input.modules].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a._id.localeCompare(b._id);
  });

  return orderedModules.map((module) => {
    const moduleLessons = (lessonRowsByModule.get(module._id) ?? []).sort(
      (a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a._id.localeCompare(b._id);
      }
    );

    const completedLessons = moduleLessons.filter((l) =>
      isCompletedRow(input.progressByLessonId.get(l._id))
    ).length;

    const percent = safePercentage(completedLessons, moduleLessons.length);

    const lessons: LessonProgressLine[] = moduleLessons.map((lesson) => {
      const row = input.progressByLessonId.get(lesson._id);
      return {
        lessonId: lesson._id,
        title: lesson.title,
        moduleId: module._id,
        status: (row?.status as LessonProgressLine["status"]) ?? NOT_STARTED,
        completedAt: row?.completedAt ?? null,
        lastViewedAt: row?.lastViewedAt ?? null,
      };
    });

    return {
      moduleId: module._id,
      title: module.title,
      description: module.description ?? null,
      totalLessons: moduleLessons.length,
      completedLessons,
      percent: percent === null ? null : Math.round(percent),
      status: deriveModuleStatus(completedLessons, moduleLessons.length),
      hasContent: moduleLessons.length > 0,
      lessons,
    };
  });
}

/** Recent "lesson viewed/completed" activity rows, newest first. */
export function buildLessonActivity(
  lessons: LessonRow[],
  progressByLessonId: ReadonlyMap<string, ProgressRow>,
  moduleTitles: ReadonlyMap<string, string | null>,
  limit = 5
): Array<{
  type: "lesson_accessed" | "lesson_completed";
  label: string;
  detail: string;
  at: string;
}> {
  const lessonById = new Map(lessons.map((l) => [l._id, l]));
  const items: Array<{
    type: "lesson_accessed" | "lesson_completed";
    label: string;
    detail: string;
    at: string;
  }> = [];

  for (const [lessonId, row] of progressByLessonId) {
    const lesson = lessonById.get(lessonId);
    if (!lesson) continue;

    const viewedAt =
      row.lastViewedAt ?? row.updatedAt ?? row.completedAt ?? undefined;
    if (viewedAt) {
      const time = Date.parse(viewedAt);
      if (Number.isFinite(time)) {
        items.push({
          type: "lesson_accessed",
          label: lesson.title,
          detail: moduleTitles.get(lesson.moduleId) ?? "Lesson",
          at: new Date(time).toISOString(),
        });
      }
    }

    if (isCompletedRow(row) && row.completedAt) {
      const time = Date.parse(row.completedAt);
      if (Number.isFinite(time)) {
        items.push({
          type: "lesson_completed",
          label: lesson.title,
          detail: moduleTitles.get(lesson.moduleId) ?? "Lesson",
          at: new Date(time).toISOString(),
        });
      }
    }
  }

  return items
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}