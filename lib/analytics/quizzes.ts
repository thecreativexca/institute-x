/**
 * Phase 19 — Quiz analytics (Part G, spec §54–§60).
 *
 * Definitions (labelled in the UI):
 *   - "attempts"       = submissions with status SUBMITTED
 *   - "students tried" = distinct students with any final attempt (submitted/expired)
 *   - pass rate        = ATTEMPT-level: passed submitted attempts / submitted attempts
 *   - "auto-submitted" = attempts with status EXPIRED
 *
 * Scores are PERCENTAGE-normalized (skip raw-mark averaging, spec §56).
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Quiz } from "@/models/Quiz";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector } from "./context";

export interface QuizPerformanceStat {
  quizId: string;
  title: string;
  courseName: string;
  quizType: string;
  studentsTried: number;
  attempts: number;
  avgPercent: number | null;
  passRate: number | null;
  highestPercent: number | null;
  lowestPercent: number | null;
  difficulty: "hard" | "ok" | "insufficient";
}

export interface QuizAnalytics {
  publishedCount: number;
  totalAttempts: number;
  autoSubmitted: number;
  studentsTried: number;
  attemptedStudents: number;
  passRate: number | null;
  avgPercent: number | null;
  perQuiz: QuizPerformanceStat[];
}

/** Minimum submitted attempts before a "hard" signal is shown (spec §58). */
const MIN_SAMPLE = 5;

export async function getQuizAnalytics(ctx: ReportContext): Promise<QuizAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);

  const quizzes = await Quiz.find({ ...courseSel, isPublished: true })
    .select("title course type passingPercentage")
    .sort({ createdAt: 1 })
    .lean();
  const quizIds = quizzes.map((q) => q._id);

  const [perQuizRaw, autoSubmitted, studentsTried] = await Promise.all([
    QuizAttempt.aggregate<{
      _id: Types.ObjectId;
      attempts: number;
      passedAttempts: number;
      sumPercent: number;
      highest: number;
      lowest: number;
      students: Types.ObjectId[];
    }>([
      { $match: { quiz: { $in: quizIds }, status: "submitted" } },
      {
        $group: {
          _id: "$quiz",
          attempts: { $sum: 1 },
          passedAttempts: { $sum: { $cond: ["$passed", 1, 0] } },
          sumPercent: { $sum: "$percentage" },
          highest: { $max: "$percentage" },
          lowest: { $min: "$percentage" },
          students: { $addToSet: "$student" },
        },
      },
    ]),
    QuizAttempt.countDocuments({ quiz: { $in: quizIds }, status: "expired" }),
    QuizAttempt.distinct("student", {
      quiz: { $in: quizIds },
      status: { $in: ["submitted", "expired"] },
    }),
  ]);

  const courseIds = [...new Set(quizzes.map((q) => q.course.toString()))];
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds.map((c) => new Types.ObjectId(c)) } })
        .select("name")
        .lean()
    : [];
  const courseName = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const quizMap = new Map(perQuizRaw.map((r) => [r._id.toString(), r]));

  let totalAttempts = 0;
  let totalPassed = 0;
  let totalSumPercent = 0;
  const perQuiz: QuizPerformanceStat[] = quizzes.map((q) => {
    const r = quizMap.get(q._id.toString());
    const attempts = r?.attempts ?? 0;
    const passed = r?.passedAttempts ?? 0;
    totalAttempts += attempts;
    totalPassed += passed;
    totalSumPercent += r?.sumPercent ?? 0;
    return {
      quizId: q._id.toString(),
      title: q.title,
      courseName: courseName.get(q.course.toString()) ?? "Unknown course",
      quizType: q.type,
      studentsTried: r?.students.length ?? 0,
      attempts,
      avgPercent: attempts > 0 ? Math.round((r!.sumPercent / attempts) * 100) / 100 : null,
      passRate: attempts > 0 ? Math.round((passed / attempts) * 1000) / 10 : null,
      highestPercent: attempts > 0 ? r!.highest : null,
      lowestPercent: attempts > 0 ? r!.lowest : null,
      difficulty:
        attempts < MIN_SAMPLE ? "insufficient" : passRateFor(r!, attempts) < 50 ? "hard" : "ok",
    };
  });

  const passRate =
    totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 1000) / 10 : null;
  const avgPercent =
    totalAttempts > 0 ? Math.round((totalSumPercent / totalAttempts) * 100) / 100 : null;

  return {
    publishedCount: quizzes.length,
    totalAttempts,
    autoSubmitted,
    studentsTried: studentsTried.length,
    attemptedStudents: studentsTried.length,
    passRate,
    avgPercent,
    perQuiz,
  };
}

function passRateFor(r: { passedAttempts: number; attempts: number }, attempts: number): number {
  return attempts > 0 ? (r.passedAttempts / attempts) * 100 : 0;
}