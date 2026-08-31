/**
 * Phase 19 — Certificate analytics (Part H, spec §61–§62). Reuses the Phase 12
 * Certificate model; `issuedAt` is the authoritative issuance timestamp.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Certificate } from "@/models/Certificate";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector, dayBucketSpec } from "./context";
import { fillSeries } from "./date-range";

export interface CertificateCourseStat {
  courseId: string;
  courseName: string;
  count: number;
}

export interface CertificateAnalytics {
  issued: number;
  active: number;
  revoked: number;
  issuedInRange: number;
  issuanceRate: number | null;
  completedEnrollments: number;
  byCourse: CertificateCourseStat[];
  trend: { label: string; count: number }[];
}

export async function getCertificateAnalytics(
  ctx: ReportContext
): Promise<CertificateAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);

  const [issued, active, revoked, issuedInRange, trendRaw, byCourseRaw] = await Promise.all([
    Certificate.countDocuments(courseSel),
    Certificate.countDocuments({ ...courseSel, status: "issued" }),
    Certificate.countDocuments({ ...courseSel, status: "revoked" }),
    Certificate.countDocuments({
      ...courseSel,
      issuedAt: { $gte: ctx.range.from, $lt: ctx.range.to },
    }),
    Certificate.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...courseSel,
          issuedAt: { $gte: ctx.range.from, $lt: ctx.range.to },
        },
      },
      { $group: { _id: dayBucketSpec("issuedAt"), count: { $sum: 1 } } },
    ]),
    Certificate.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: courseSel },
      { $group: { _id: "$course", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]),
  ]);

  const completedEnrollments = await Enrollment.countDocuments({
    ...courseSelector(ctx),
    status: "completed",
  });

  const trendMap: Record<string, number> = {};
  for (const r of trendRaw) trendMap[r._id] = r.count;
  const trend = fillSeries(trendMap, ctx.range, () => 0).map((s) => ({
    label: s.label,
    count: s.value,
  }));

  const courseIds = byCourseRaw.map((r) => r._id);
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("name").lean()
    : [];
  const nameById = new Map(courses.map((c) => [c._id.toString(), c.name]));
  const byCourse: CertificateCourseStat[] = byCourseRaw.map((r) => ({
    courseId: r._id.toString(),
    courseName: nameById.get(r._id.toString()) ?? "Unknown course",
    count: r.count,
  }));

  return {
    issued,
    active,
    revoked,
    issuedInRange,
    // Spec §62: certificates issued per completed enrollment. A completed
    // enrollment may be eligible but its certificate not yet generated.
    issuanceRate:
      completedEnrollments > 0
        ? Math.round((issued / completedEnrollments) * 1000) / 10
        : null,
    completedEnrollments,
    byCourse,
    trend,
  };
}