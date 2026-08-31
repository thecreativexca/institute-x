/**
 * Phase 19 — Learning analytics (Part E, spec §42–§47).
 *
 * Active learner = student with real learning activity (a lesson completion or
 * a recent view timestamp) in the selected range (spec §43) — never just any
 * enrolled student.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Progress } from "@/models/Progress";
import { Lesson } from "@/models/Lesson";
import { Module } from "@/models/Module";
import { Enrollment } from "@/models/Enrollment";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector, dayBucketSpec } from "./context";
import { fillSeries } from "./date-range";

export interface LearningAnalytics {
  completedLessons: number;
  activeLearners: number;
  recentlyActive7d: number;
  learningCompleteEnrollments: number;
  enrolledLearners: number;
  avgCourseProgress: number | null;
  lessonTrend: { label: string; count: number }[];
}

export async function getLearningAnalytics(
  ctx: ReportContext
): Promise<LearningAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);
  const completedRange = { $gte: ctx.range.from, $lt: ctx.range.to };

  const [completedLessons, activeLearners, recent7d, lessonTrendRaw, enrolledLearners] =
    await Promise.all([
      Progress.countDocuments({ ...courseSel, status: "completed", completedAt: completedRange }),
      Progress.distinct("student", {
        ...courseSel,
        $or: [{ completedAt: completedRange }, { lastViewedAt: completedRange }],
      }),
      Progress.distinct("student", {
        ...courseSel,
        $or: [
          { completedAt: { $gte: new Date(Date.now() - 7 * 86_400_000) } },
          { lastViewedAt: { $gte: new Date(Date.now() - 7 * 86_400_000) } },
        ],
      }),
      Progress.aggregate<{ _id: string; count: number }>([
        { $match: { ...courseSel, status: "completed", completedAt: completedRange } },
        { $group: { _id: dayBucketSpec("completedAt"), count: { $sum: 1 } } },
      ]),
      Enrollment.distinct("student", courseSel),
    ]);

  const trendMap: Record<string, number> = {};
  for (const r of lessonTrendRaw) trendMap[r._id] = r.count;
  const lessonTrend = fillSeries(trendMap, ctx.range, () => 0).map((s) => ({
    label: s.label,
    count: s.value,
  }));

  // Learning-complete enrollments: (course,student) pairs where every published
  // lesson is completed.
  const lessonCounts = await Lesson.aggregate<{ _id: Types.ObjectId; total: number }>([
    { $match: { ...courseSelector(ctx), isPublished: true } },
    { $group: { _id: "$course", total: { $sum: 1 } } },
  ]);
  const totalByCourse = new Map(lessonCounts.map((r) => [r._id.toString(), r.total]));
  const completePairs = await Progress.aggregate<{
    course: Types.ObjectId;
    completed: number;
  }>([
    { $match: { ...courseSelector(ctx), status: "completed" } },
    {
      $group: {
        _id: { course: "$course", student: "$student" },
        completed: { $sum: 1 },
      },
    },
    { $project: { course: "$_id.course", completed: 1, _id: 0 } },
  ]);
  const learningCompleteEnrollments = completePairs.filter((p) => {
    const total = totalByCourse.get(p.course.toString()) ?? 0;
    return total > 0 && p.completed >= total;
  }).length;

  // Average course progress across all courses (mean of per-course means).
  const progressStats = await Progress.aggregate<{
    _id: Types.ObjectId;
    completed: number;
    students: number;
  }>([
    { $match: { ...courseSelector(ctx), status: "completed" } },
    { $group: { _id: "$course", completed: { $sum: 1 }, students: { $addToSet: "$student" } } },
    { $project: { completed: 1, students: { $size: "$students" } } },
  ]);
  let avgCourseProgress: number | null = null;
  const courseSums = progressStats.map((p) => {
    const total = totalByCourse.get(p._id.toString()) ?? 0;
    return total > 0 && p.students > 0 ? (p.completed / (p.students * total)) * 100 : null;
  });
  const valid = courseSums.filter((x): x is number => x !== null);
  if (valid.length > 0) {
    avgCourseProgress =
      Math.round((valid.reduce((s, x) => s + x, 0) / valid.length) * 1000) / 10;
  }

  return {
    completedLessons,
    activeLearners: activeLearners.length,
    recentlyActive7d: recent7d.length,
    learningCompleteEnrollments,
    enrolledLearners: enrolledLearners.length,
    avgCourseProgress,
    lessonTrend,
  };
}
export interface LessonDropoffStat {
  lessonId: string;
  title: string;
  moduleTitle: string;
  eligibleStudents: number;
  completed: number;
  completionPercent: number | null;
}

export interface ModuleDropoffStat {
  moduleId: string;
  title: string;
  started: number;
  completed: number;
}

/**
 * Lesson drop-off for a specific course (spec §46). Requires a concrete course
 * selected via the course filter; returns empty if none is chosen.
 */
export async function getLessonDropoff(
  ctx: ReportContext
): Promise<{ lessons: LessonDropoffStat[]; modules: ModuleDropoffStat[] }> {
  await connectDB();
  if (!ctx.courseId || !/^[a-f\d]{24}$/i.test(ctx.courseId)) {
    return { lessons: [], modules: [] };
  }
  const courseId = new Types.ObjectId(ctx.courseId);

  const [lessons, modules, completedRows, eligible] = await Promise.all([
    Lesson.find({ course: courseId, isPublished: true })
      .select("title module sortOrder")
      .sort({ module: 1, sortOrder: 1 })
      .lean(),
    Module.find({ course: courseId }).select("title sortOrder").sort({ sortOrder: 1 }).lean(),
    Progress.aggregate<{ _id: Types.ObjectId; completed: number }>([
      { $match: { course: courseId, status: "completed" } },
      { $group: { _id: "$lesson", students: { $addToSet: "$student" } } },
      { $project: { _id: 1, completed: { $size: "$students" } } },
    ]),
    Enrollment.countDocuments({ course: courseId }),
  ]);

  const completedMap = new Map(completedRows.map((r) => [r._id.toString(), r.completed]));
  const moduleTitle = new Map(modules.map((m) => [m._id.toString(), m.title]));

  const lessonsOut: LessonDropoffStat[] = lessons.map((l) => {
    const completed = completedMap.get(l._id.toString()) ?? 0;
    return {
      lessonId: l._id.toString(),
      title: l.title,
      moduleTitle: moduleTitle.get(l.module.toString()) ?? "—",
      eligibleStudents: eligible,
      completed,
      completionPercent:
        eligible > 0 ? Math.round((completed / eligible) * 1000) / 10 : null,
    };
  });

  // Module drop-off (spec §45): started = distinct students with any non-null
  // progress in the module's lessons; completed = distinct students finished.
  const lessonStartRows = await Progress.aggregate<{
    _id: Types.ObjectId;
    students: Types.ObjectId[];
  }>([
    { $match: { course: courseId, status: { $ne: "not_started" } } },
    { $group: { _id: "$lesson", students: { $addToSet: "$student" } } },
  ]);
  const startSet = new Map(lessonStartRows.map((r) => [r._id.toString(), r.students.length]));
  const lessonModule = new Map(lessons.map((l) => [l._id.toString(), l.module.toString()]));
  void lessonModule;

  const modulesOut: ModuleDropoffStat[] = modules.map((m) => {
    const moduleLessons = lessons.filter((l) => l.module.toString() === m._id.toString());
    let completed = 0;
    let started = 0;
    for (const l of moduleLessons) {
      completed += completedMap.get(l._id.toString()) ?? 0;
      started += startSet.get(l._id.toString()) ?? 0;
    }
    return { moduleId: m._id.toString(), title: m.title, started, completed };
  });

  return { lessons: lessonsOut, modules: modulesOut };
}