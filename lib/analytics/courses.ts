/**
 * Phase 19 — Course performance analytics (Part D, spec §36–§41).
 *
 * Completion uses the authoritative Enrollment status (spec §38), identical to
 * the Phase 11 completion flow. Average learning progress reuses the same
 * lesson-progress rule: (completed progress records) / (students × published
 * lessons) × 100 — mathematically equal to the mean per-student lesson %.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Lesson } from "@/models/Lesson";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector } from "./context";

export type CourseHealth = "strong" | "attention" | "insufficient";

export interface CoursePerformanceStat {
  courseId: string;
  courseName: string;
  enrollments: number;
  activeStudents: number;
  completedStudents: number;
  completionRate: number | null;
  completionBase: number;
  avgProgress: number | null;
  studentsWithProgress: number;
  totalLessons: number;
  health: CourseHealth;
}

export interface CoursePerformanceReport {
  courses: CoursePerformanceStat[];
  totalCourses: number;
}

/** Minimum eligible enrollments before a health signal is surfaced (spec §40/§41). */
const MIN_SAMPLE = 5;

export async function getCoursePerformance(
  ctx: ReportContext
): Promise<CoursePerformanceReport> {
  await connectDB();
  const courseSel = courseSelector(ctx);

  const [enrollRows, progressRows, lessonRows, courses] = await Promise.all([
    Enrollment.aggregate<{
      _id: Types.ObjectId;
      total: number;
      active: number;
      completed: number;
    }>([
      { $match: courseSel },
      {
        $group: {
          _id: "$course",
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
    ]),
    Progress.aggregate<{
      _id: Types.ObjectId;
      completed: number;
      students: number;
    }>([
      { $match: { ...courseSelector(ctx), status: "completed" } },
      {
        $group: {
          _id: "$course",
          completed: { $sum: 1 },
          students: { $addToSet: "$student" },
        },
      },
      { $project: { completed: 1, students: { $size: "$students" } } },
    ]),
    Lesson.aggregate<{ _id: Types.ObjectId; total: number }>([
      { $match: { ...courseSelector(ctx), isPublished: true } },
      { $group: { _id: "$course", total: { $sum: 1 } } },
    ]),
    Course.find(courseSel).select("name").sort({ name: 1 }).lean(),
  ]);

  const enrollMap = new Map(enrollRows.map((r) => [r._id.toString(), r]));
  const progressMap = new Map(progressRows.map((r) => [r._id.toString(), r]));
  const lessonMap = new Map(lessonRows.map((r) => [r._id.toString(), r.total]));

  const coursesOut: CoursePerformanceStat[] = courses.map((c) => {
    const id = c._id.toString();
    const e = enrollMap.get(id);
    const p = progressMap.get(id);
    const totalLessons = lessonMap.get(id) ?? 0;
    const enrollments = e?.total ?? 0;
    const activeStudents = e?.active ?? 0;
    const completedStudents = e?.completed ?? 0;
    const completionBase = activeStudents + completedStudents;
    const completionRate =
      completionBase > 0 ? Math.round((completedStudents / completionBase) * 1000) / 10 : null;
    const studentsWithProgress = p?.students ?? 0;
    const avgProgress =
      p && totalLessons > 0 && p.students > 0
        ? Math.round((p.completed / (p.students * totalLessons)) * 1000) / 10
        : null;

    let health: CourseHealth = "insufficient";
    if (completionBase >= MIN_SAMPLE) {
      health = completionRate !== null && completionRate < 30 ? "attention" : "strong";
    }

    return {
      courseId: id,
      courseName: c.name,
      enrollments,
      activeStudents,
      completedStudents,
      completionRate,
      completionBase,
      avgProgress,
      studentsWithProgress,
      totalLessons,
      health,
    };
  });

  return { courses: coursesOut, totalCourses: coursesOut.length };
}