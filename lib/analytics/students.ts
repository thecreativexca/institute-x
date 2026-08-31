/**
 * Phase 19 — Student analytics (Part A, spec §13–§19).
 *
 * Returns aggregates only; individual student names/emails are NEVER included
 * here. Detailed list data is gated by `students.read` elsewhere (spec §114).
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Types } from "mongoose";
import type {
  ReportContext,
} from "./context";
import { courseSelector, dayBucketSpec, toCountMap } from "./context";
import { fillSeries } from "./date-range";
import { registrationsDelta } from "./students-utils";

export interface StudentAnalytics {
  totalStudents: number;
  active: number;
  inactive: number;
  suspended: number;
  verified: number;
  unverified: number;
  newRegistrations: number;
  withEnrollment: number;
  withZeroEnrollments: number;
  statusBreakdown: { status: string; count: number; percent: number }[];
  verifiedBreakdown: { verified: boolean; count: number; percent: number }[];
  growth: { label: string; newRegistrations: number; cumulative: number }[];
}

/** Optional id set narrowing (for faculty course scope). */
async function scopedStudentIds(ctx: ReportContext): Promise<Set<string> | null> {
  if (!ctx.scope) return null;
  await connectDB();
  const ids = await Enrollment.distinct("student", {
    course: { $in: ctx.scope._id.$in },
  });
  return new Set(ids.map((id) => id.toString()));
}

export async function getStudentAnalytics(ctx: ReportContext): Promise<StudentAnalytics> {
  await connectDB();
  const scope = await scopedStudentIds(ctx);
  const studentFilter = (
    extra: Record<string, unknown> = {}
  ): Record<string, unknown> => {
    const match: Record<string, unknown> = { role: "student", ...extra };
    if (scope) match._id = { $in: [...scope].map((s) => new Types.ObjectId(s)) };
    return match;
  };

  const [totalStudents, active, inactive, suspended] = await Promise.all([
    User.countDocuments(studentFilter()),
    User.countDocuments(studentFilter({ status: "active" })),
    User.countDocuments(studentFilter({ status: "inactive" })),
    User.countDocuments(studentFilter({ status: "suspended" })),
  ]);

  const [verified, unverified] = await Promise.all([
    User.countDocuments(studentFilter({ emailVerifiedAt: { $ne: null } })),
    User.countDocuments(studentFilter({ emailVerifiedAt: null })),
  ]);

  // New registrations in the range.
  const newRegistrations = await User.countDocuments(
    studentFilter({
      createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
    } as Record<string, unknown>)
  );

  // Enrollment-based counts (respect scope when narrowing).
  const enrollmentMatch: Record<string, unknown> = {};
  const courseSel = courseSelector(ctx);
  Object.assign(enrollmentMatch, courseSel);
  if (scope) enrollmentMatch.student = { $in: [...scope].map((s) => new Types.ObjectId(s)) };
  const enrolledIds = await Enrollment.distinct("student", enrollmentMatch);
  const withEnrollment = enrolledIds.length;
  const totalInUniverse = scope ? scope.size : totalStudents;
  const withZeroEnrollments = Math.max(0, totalInUniverse - withEnrollment);

  // Growth series.
  const growthRaw = await User.aggregate<{ _id: string; count: number }>([
    { $match: studentFilter({ createdAt: { $gte: ctx.range.from, $lt: ctx.range.to } }) },
    { $group: { _id: dayBucketSpec("createdAt"), count: { $sum: 1 } } },
  ]);
  const byDay = toCountMap(growthRaw as unknown as { _id: string; count: number }[]);
  const series = fillSeries(byDay, ctx.range, () => 0);
  // Cumulative baseline: students who existed before the range start.
  const beforeRange = await User.countDocuments(
    studentFilter({ createdAt: { $lt: ctx.range.from } } as Record<string, unknown>)
  );
  let cumulative = beforeRange;
  const growth = series.map((s) => {
    cumulative += s.value;
    return { label: s.label, newRegistrations: s.value, cumulative };
  });

  // Status/verified breakdowns with safe percentages.
  const statusBreakdown = [
    { status: "active", count: active },
    { status: "inactive", count: inactive },
    { status: "suspended", count: suspended },
  ].map((r) => ({
    ...r,
    percent: totalStudents > 0 ? Math.round((r.count / totalStudents) * 1000) / 10 : 0,
  }));
  const verifiedBreakdown = [
    { verified: true, count: verified },
    { verified: false, count: unverified },
  ].map((r) => ({
    ...r,
    percent: totalStudents > 0 ? Math.round((r.count / totalStudents) * 1000) / 10 : 0,
  }));

  return {
    totalStudents,
    active,
    inactive,
    suspended,
    verified,
    unverified,
    newRegistrations,
    withEnrollment,
    withZeroEnrollments,
    statusBreakdown,
    verifiedBreakdown,
    growth,
  };
}

export { registrationsDelta };