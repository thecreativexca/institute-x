/**
 * Phase 19 — Assignment analytics (Part F, spec §48–§53).
 *
 * Because Submission is unique per (student, assignment) (a resubmission
 * replaces the earlier one), "submitted" naturally counts each student once —
 * matching the student-level submission rate (spec §50, §138). Late is derived
 * from `submittedAt > dueAt` (never a stale stored flag, spec §51).
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Assignment } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { courseSelector } from "./context";

export interface AssignmentPerformanceStat {
  assignmentId: string;
  title: string;
  courseName: string;
  maxScore: number;
  dueAt: string | null;
  eligibleStudents: number;
  submitted: number;
  submissionRate: number | null;
  late: number;
  lateRate: number | null;
  graded: number;
  pendingReview: number;
  avgScorePercent: number | null;
}

export interface AssignmentAnalytics {
  publishedCount: number;
  expected: number;
  submitted: number;
  pendingSubmissions: number;
  late: number;
  lateRate: number | null;
  graded: number;
  pendingReviews: number;
  submissionRate: number | null;
  perAssignment: AssignmentPerformanceStat[];
  pendingReviewList: AssignmentPerformanceStat[];
}

export async function getAssignmentAnalytics(
  ctx: ReportContext
): Promise<AssignmentAnalytics> {
  await connectDB();
  const courseSel = courseSelector(ctx);

  const assignments = await Assignment.find({
    ...courseSel,
    isPublished: true,
  }).select("title course maxScore dueAt").sort({ createdAt: 1 }).lean();

  const assignmentIds = assignments.map((a) => a._id);
  const courseIds = [...new Set(assignments.map((a) => a.course.toString()))];

  const [submissions, enrollRows, courses] = await Promise.all([
    Submission.aggregate<{
      _id: Types.ObjectId;
      count: number;
      ungraded: number;
      gradedCount: number;
    }>([
      { $match: { assignment: { $in: assignmentIds } } },
      {
        $group: {
          _id: "$assignment",
          count: { $sum: 1 },
          ungraded: { $sum: { $cond: [{ $eq: ["$status", "submitted"] }, 1, 0] } },
          gradedCount: { $sum: { $cond: [{ $eq: ["$status", "graded"] }, 1, 0] } },
        },
      },
    ]),
    Enrollment.aggregate<{ _id: Types.ObjectId; eligible: number }>([
      {
        $match: {
          course: { $in: courseIds.map((c) => new Types.ObjectId(c)) },
          status: { $in: ["active", "completed"] },
        },
      },
      { $group: { _id: "$course", students: { $addToSet: "$student" } } },
      { $project: { _id: 1, eligible: { $size: "$students" } } },
    ]),
    Course.find({ _id: { $in: courseIds.map((c) => new Types.ObjectId(c)) } })
      .select("name")
      .lean(),
  ]);

  const courseName = new Map(courses.map((c) => [c._id.toString(), c.name]));
  const eligibleByCourse = new Map(enrollRows.map((r) => [r._id.toString(), r.eligible]));
  const subMap = new Map(submissions.map((r) => [r._id.toString(), r]));

  // Late + normalized score need the actual submission documents.
  const subDetails = await Submission.find({ assignment: { $in: assignmentIds } })
    .select("assignment submittedAt totalMarks score status")
    .lean();
  const lateCountByAssignment: Record<string, number> = {};
  const scoreAcc: Record<string, { sum: number; n: number }> = {};
  const dueByAss: Record<string, Date | null> = {};
  for (const a of assignments) dueByAss[a._id.toString()] = a.dueAt ?? null;
  for (const s of subDetails) {
    const key = s.assignment.toString();
    const due = dueByAss[key];
    if (due && s.submittedAt > due) {
      lateCountByAssignment[key] = (lateCountByAssignment[key] ?? 0) + 1;
    }
    if (s.status === "graded" && s.totalMarks && s.totalMarks > 0) {
      const acc = (scoreAcc[key] ??= { sum: 0, n: 0 });
      acc.sum += (Math.min(s.score ?? 0, s.totalMarks) / s.totalMarks) * 100;
      acc.n += 1;
    }
  }
let pendingReviewsTotal = 0;
  let submittedTotal = 0;
  let expectedTotal = 0;
  const perAssignment: AssignmentPerformanceStat[] = assignments.map((a) => {
    const aid = a._id.toString();
    const s = subMap.get(aid);
    const count = s?.count ?? 0;
    const ungraded = s?.ungraded ?? 0;
    const graded = s?.gradedCount ?? 0;
    const late = lateCountByAssignment[aid] ?? 0;
    const eligible = eligibleByCourse.get(a.course.toString()) ?? 0;
    const acc = scoreAcc[aid];
    const avgScorePercent =
      acc && acc.n > 0 ? Math.round((acc.sum / acc.n) * 1000) / 10 : null;

    submittedTotal += count;
    expectedTotal += eligible;
    pendingReviewsTotal += ungraded;

    return {
      assignmentId: aid,
      title: a.title,
      courseName: courseName.get(a.course.toString()) ?? "Unknown course",
      maxScore: a.maxScore,
      dueAt: a.dueAt?.toISOString() ?? null,
      eligibleStudents: eligible,
      submitted: count,
      submissionRate: eligible > 0 ? Math.round((count / eligible) * 1000) / 10 : null,
      late,
      lateRate: count > 0 ? Math.round((late / count) * 1000) / 10 : null,
      graded,
      pendingReview: ungraded,
      avgScorePercent,
    };
  });

  const submissionRate =
    expectedTotal > 0 ? Math.round((submittedTotal / expectedTotal) * 1000) / 10 : null;
  const totalLate = perAssignment.reduce((s, a) => s + a.late, 0);
  const lateRate =
    submittedTotal > 0 ? Math.round((totalLate / submittedTotal) * 1000) / 10 : null;

  const pendingReviewList = [...perAssignment]
    .filter((a) => a.pendingReview > 0)
    .sort((a, b) => b.pendingReview - a.pendingReview);

  return {
    publishedCount: assignments.length,
    expected: expectedTotal,
    submitted: submittedTotal,
    pendingSubmissions: Math.max(0, expectedTotal - submittedTotal),
    late: totalLate,
    lateRate,
    graded: perAssignment.reduce((s, a) => s + a.graded, 0),
    pendingReviews: pendingReviewsTotal,
    submissionRate,
    perAssignment,
    pendingReviewList,
  };
}