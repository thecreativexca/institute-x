/**
 * Phase 19 — Revenue & payment analytics (Part C, spec §26–§35).
 *
 * CALLER MUST gate with `payments.read` BEFORE calling this (see permissions.ts).
 * All amounts are PAISE; aggregation happens in paise and conversion to display
 * currency is done by the UI (spec §30).
 *
 * Authoritative verified revenue = sum of Payment.amount where status === PAID,
 * bucketed by `paidAt` (spec §27, §31). CREATED/PENDING/FAILED are excluded.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Payment } from "@/models/Payment";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector, dayBucketSpec } from "./context";
import { fillSeries } from "./date-range";

export interface CourseRevenueStat {
  courseId: string;
  courseName: string;
  paidEnrollments: number;
  grossPaise: number;
  averagePaise: number;
}

export interface RevenueAnalytics {
  grossPaise: number;
  paidCount: number;
  averageOrderValuePaise: number;
  failedCount: number;
  pendingCount: number;
  refundedPaise: number;
  refundedCount: number;
  netPaise: number;
  createdAtCount: number;
  successRate: number | null;
  statusBreakdown: { status: string; count: number; amountPaise: number }[];
  trend: { label: string; amountPaise: number; count: number }[];
  byCourse: CourseRevenueStat[];
}

const PERIOD_STATUSES = ["created", "pending", "paid", "failed", "refunded"];

export async function getRevenueAnalytics(
  ctx: ReportContext
): Promise<RevenueAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);

  // Paid-only matched by paidAt (authoritative revenue window).
  const paidMatch: Record<string, unknown> = {
    ...courseSel,
    status: "paid",
    paidAt: { $gte: ctx.range.from, $lt: ctx.range.to },
  };

  const [grossRows, trendRaw, byCourseRaw, statusRows] = await Promise.all([
    Payment.aggregate<{ totalPaise: number; count: number }>([
      { $match: paidMatch },
      { $group: { _id: null, totalPaise: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate<{ _id: string; totalPaise: number; count: number }>([
      { $match: paidMatch },
      {
        $group: {
          _id: dayBucketSpec("paidAt"),
          totalPaise: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
    Payment.aggregate<{
      _id: Types.ObjectId;
      grossPaise: number;
      paidEnrollments: number;
    }>([
      { $match: paidMatch },
      {
        $group: {
          _id: "$course",
          grossPaise: { $sum: "$amount" },
          paidEnrollments: { $sum: 1 },
        },
      },
      { $sort: { grossPaise: -1 } },
      { $limit: 20 },
    ]),
    Payment.aggregate<{ _id: string; count: number; amountPaise: number }>([
      {
        $match: {
          ...courseSel,
          status: { $in: PERIOD_STATUSES },
          createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
        },
      },
      { $group: { _id: "$status", count: { $sum: 1 }, amountPaise: { $sum: "$amount" } } },
    ]),
  ]);

  const grossPaise = grossRows[0]?.totalPaise ?? 0;
  const paidCount = grossRows[0]?.count ?? 0;
  const averageOrderValuePaise =
    paidCount > 0 ? Math.round(grossPaise / paidCount) : 0;

  const byStatus: Record<string, { count: number; amountPaise: number }> = {};
  for (const r of statusRows) {
    byStatus[r._id] = { count: r.count, amountPaise: r.amountPaise };
  }
  const failedCount = byStatus["failed"]?.count ?? 0;
  const pendingCount = (byStatus["created"]?.count ?? 0) + (byStatus["pending"]?.count ?? 0);
  const refundedCount = byStatus["refunded"]?.count ?? 0;
  const refundedPaise = byStatus["refunded"]?.amountPaise ?? 0;
  const netPaise = Math.max(0, grossPaise - refundedPaise);
  const createdAtCount = PERIOD_STATUSES.reduce(
    (s, k) => s + (byStatus[k]?.count ?? 0),
    0
  );
  const finalized = paidCount + failedCount;
  const successRate = finalized > 0 ? Math.round((paidCount / finalized) * 1000) / 10 : null;

  // Gap-filled revenue trend (amount + payment count).
  const trendMap: Record<string, { amountPaise: number; count: number }> = {};
  for (const r of trendRaw) {
    trendMap[r._id] = { amountPaise: r.totalPaise, count: r.count };
  }
  const trend = fillSeries(trendMap, ctx.range, () => ({ amountPaise: 0, count: 0 })).map(
    (s) => ({ label: s.label, amountPaise: s.value.amountPaise, count: s.value.count })
  );

  const courseIds = byCourseRaw.map((r) => r._id);
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("name").lean()
    : [];
  const nameById = new Map(courses.map((c) => [c._id.toString(), c.name]));
  const byCourse: CourseRevenueStat[] = byCourseRaw.map((r) => ({
    courseId: r._id.toString(),
    courseName: nameById.get(r._id.toString()) ?? "Unknown course",
    paidEnrollments: r.paidEnrollments,
    grossPaise: r.grossPaise,
    averagePaise:
      r.paidEnrollments > 0 ? Math.round(r.grossPaise / r.paidEnrollments) : 0,
  }));

  const statusBreakdown = Object.entries(byStatus)
    .map(([status, v]) => ({ status, count: v.count, amountPaise: v.amountPaise }))
    .sort((a, b) => b.count - a.count);

  return {
    grossPaise,
    paidCount,
    averageOrderValuePaise,
    failedCount,
    pendingCount,
    refundedPaise,
    refundedCount,
    netPaise,
    createdAtCount,
    successRate,
    statusBreakdown,
    trend,
    byCourse,
  };
}