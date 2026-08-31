/**
 * Phase 19 — Enrollment analytics (Part B, spec §20–§25).
 *
 * Completion rate definition (spec §22): `completed / (active + completed)`.
 * Cancelled/expired/pending are EXCLUDED from this denominator by design.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { EnrollmentStatus } from "@/lib/constants";
import type { ReportContext } from "./context";
import { courseSelector, dayBucketSpec, toCountMap } from "./context";
import { fillSeries } from "./date-range";

export type EnrollmentSourceLabel = "Paid" | "Free" | "Manual / Admin granted";

export interface EnrollmentSourceStat {
  key: "paid" | "free" | "manual";
  label: EnrollmentSourceLabel;
  count: number;
}

export interface CourseEnrollmentStat {
  courseId: string;
  courseName: string;
  total: number;
  new: number;
  active: number;
  completed: number;
  completionRate: number | null;
}

export interface EnrollmentAnalytics {
  total: number;
  new: number;
  active: number;
  completed: number;
  cancelled: number;
  expired: number;
  pending: number;
  completionCount: number;
  completionBase: number;
  completionRate: number | null;
  trend: { label: string; count: number }[];
  byCourse: CourseEnrollmentStat[];
  bySource: EnrollmentSourceStat[];
}

const ELIGIBLE_STATUSES: readonly EnrollmentStatus[] = ["active", "completed"];

export async function getEnrollmentAnalytics(
  ctx: ReportContext
): Promise<EnrollmentAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);
  const courseMatch: Record<string, unknown> = { ...courseSel };

  // Status counts (all time within course scope).
  const statusRows = await Enrollment.aggregate<{ _id: string; count: number }>([
    { $match: courseMatch },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r._id] = r.count;

  const total = statusRows.reduce((s, r) => s + r.count, 0);
  const active = byStatus["active"] ?? 0;
  const completed = byStatus["completed"] ?? 0;
  const cancelled = byStatus["cancelled"] ?? 0;
  const expired = byStatus["expired"] ?? 0;
  const pending = byStatus["pending"] ?? 0;
  const completionBase = active + completed;
  const completionRate =
    completionBase > 0 ? Math.round((completed / completionBase) * 1000) / 10 : null;

  // New enrollments in range.
  const newCount = await Enrollment.countDocuments({
    ...courseMatch,
    createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
  });

  // Trend of enrollment creation in range.
  const trendRaw = await Enrollment.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        ...courseMatch,
        createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
      },
    },
    { $group: { _id: dayBucketSpec("createdAt"), count: { $sum: 1 } } },
  ]);
  const trendMap = toCountMap(trendRaw as unknown as { _id: string; count: number }[]);
  const trend = fillSeries(trendMap, ctx.range, () => 0).map((s) => ({
    label: s.label,
    count: s.value,
  }));
// By-course stats (top courses by total).
  const courseRows = await Enrollment.aggregate<{
    _id: Types.ObjectId;
    total: number;
    new: number;
    active: number;
    completed: number;
  }>([
    { $match: courseMatch },
    {
      $group: {
        _id: "$course",
        total: { $sum: 1 },
        new: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", ctx.range.from] },
                  { $lt: ["$createdAt", ctx.range.to] },
                ],
              },
              1,
              0,
            ],
          },
        },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
      },
    },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ]);

  const courseIds = courseRows.map((r) => r._id);
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("name").lean()
    : [];
  const nameById = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const byCourse: CourseEnrollmentStat[] = courseRows.map((r) => {
    const base = r.active + r.completed;
    return {
      courseId: r._id.toString(),
      courseName: nameById.get(r._id.toString()) ?? "Unknown course",
      total: r.total,
      new: r.new,
      active: r.active,
      completed: r.completed,
      completionRate: base > 0 ? Math.round((r.completed / base) * 1000) / 10 : null,
    };
  });

  // Free vs Paid vs Manual — from authoritative linked PAID payment records.
  const bySource = await computeSourceBreakdown(ctx);

  return {
    total,
    new: newCount,
    active,
    completed,
    cancelled,
    expired,
    pending,
    completionCount: completed,
    completionBase,
    completionRate,
    trend,
    byCourse,
    bySource,
  };
}

async function computeSourceBreakdown(
  ctx: ReportContext
): Promise<EnrollmentSourceStat[]> {
  await connectDB();

  // Manual/admin = eligible enrollments with no linked paid payment.
  const eligibleTotal = await Enrollment.countDocuments({
    ...courseSelector(ctx),
    status: { $in: ELIGIBLE_STATUSES },
  });
  const paid = await countSource(ctx, "razorpay");
  const free = await countSource(ctx, "free");
  const manualCount = Math.max(0, eligibleTotal - paid - free);

  return [
    { key: "paid", label: "Paid", count: paid },
    { key: "free", label: "Free", count: free },
    { key: "manual", label: "Manual / Admin granted", count: manualCount },
  ];
}

async function countSource(ctx: ReportContext, provider: string): Promise<number> {
  await connectDB();
  const rows = await Enrollment.aggregate<{ count: number }>([
    { $match: { ...courseSelector(ctx), status: { $in: ELIGIBLE_STATUSES } } },
    {
      $lookup: {
        from: "payments",
        let: { eid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$enrollment", "$$eid"] },
                  { $eq: ["$status", "paid"] },
                  { $eq: ["$provider", provider] },
                ],
              },
            },
          },
          { $limit: 1 },
        ],
        as: "p",
      },
    },
    { $match: { p: { $ne: [] } } },
    { $count: "count" },
  ]);
  return rows[0]?.count ?? 0;
}