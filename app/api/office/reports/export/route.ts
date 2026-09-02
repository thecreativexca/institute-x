import { NextRequest, NextResponse } from "next/server";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import {
  loadReport,
  getStudentAnalytics,
  getEnrollmentAnalytics,
  getRevenueAnalytics,
  getCoursePerformance,
  getAssignmentAnalytics,
  getQuizAnalytics,
  getSupportAnalytics,
  toCsv,
  csvResponse,
} from "@/lib/analytics";
import { abilitiesFor } from "@/lib/analytics/permissions";

export const dynamic = "force-dynamic";

type ExportType =
  | "students"
  | "enrollments"
  | "courses"
  | "revenue"
  | "assignments"
  | "quizzes"
  | "support";

/**
 * CSV export (spec §97–§101). Enforces the SAME permission gates as the
 * corresponding report page, before any aggregation runs. No generic
 * "export everything" endpoint exists.
 */
export async function GET(request: NextRequest) {
  const { user: session, error } = await getValidatedSession();
  if (!session || error) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.url;
  const url = new URL(body);
  const type = url.searchParams.get("type") as ExportType | null;
  if (!type) {
    return NextResponse.json({ success: false, error: "Missing type" }, { status: 400 });
  }

  const params: Record<string, string> = {};
  for (const key of ["range", "from", "to", "course"]) {
    const v = url.searchParams.get(key);
    if (v) params[key] = v;
  }

  const loaded = await loadReport(session, params);
  const { ctx, abilities } = loaded;
  if (!abilities.read) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  switch (type) {
    case "students": {
      if (!abilities.students) return deny();
      const d = await getStudentAnalytics(ctx);
      const rows = d.growth.map((g) => [g.label, g.newRegistrations, g.cumulative]);
      return csvResponse(toCsv(["Date", "New registrations", "Cumulative students"], rows), "students.csv");
    }
    case "enrollments": {
      if (!abilities.enrollments) return deny();
      const d = await getEnrollmentAnalytics(ctx);
      const rows = d.byCourse.map((c) => [
        c.courseName,
        c.total,
        c.new,
        c.active,
        c.completed,
        c.completionRate === null ? "" : String(c.completionRate),
      ]);
      return csvResponse(toCsv(["Course", "Total", "New", "Active", "Completed", "Completion %"], rows), "enrollments.csv");
    }
    case "courses": {
      if (!abilities.courses) return deny();
      const d = await getCoursePerformance(ctx);
      const rows = d.courses.map((c) => [
        c.courseName,
        c.enrollments,
        c.activeStudents,
        c.completedStudents,
        c.completionRate === null ? "" : String(c.completionRate),
        c.avgProgress === null ? "" : String(c.avgProgress),
        c.health,
      ]);
      return csvResponse(toCsv(["Course", "Enrollments", "Active", "Completed", "Completion %", "Avg progress %", "Health"], rows), "courses.csv");
    }
    case "revenue": {
      // Financial CSV requires payments.read (spec §98/§113).
      if (!abilities.revenue) return deny();
      const d = await getRevenueAnalytics(ctx);
      const rows = d.byCourse.map((c) => [
        c.courseName,
        c.paidEnrollments,
        String(c.grossPaise),
        String(c.averagePaise),
      ]);
      return csvResponse(
        toCsv(
          ["Course", "Paid enrollments", "Gross revenue (paise)", "Avg transaction (paise)"],
          [
            ...rows,
            ["TOTAL", d.paidCount, String(d.grossPaise), String(d.averageOrderValuePaise)],
          ]
        ),
        "revenue.csv"
      );
    }
    case "assignments": {
      if (!abilities.assignments) return deny();
      const d = await getAssignmentAnalytics(ctx);
      const rows = d.perAssignment.map((a) => [
        a.title,
        a.courseName,
        a.eligibleStudents,
        a.submitted,
        a.submissionRate === null ? "" : String(a.submissionRate),
        a.late,
        a.graded,
        a.avgScorePercent === null ? "" : String(a.avgScorePercent),
      ]);
      return csvResponse(toCsv(["Assignment", "Course", "Eligible", "Submitted", "Submission %", "Late", "Graded", "Avg score %"], rows), "assignments.csv");
    }
    case "quizzes": {
      if (!abilities.quizResults) return deny();
      const d = await getQuizAnalytics(ctx);
      const rows = d.perQuiz.map((q) => [
        q.title,
        q.courseName,
        q.studentsTried,
        q.attempts,
        q.avgPercent === null ? "" : String(q.avgPercent),
        q.passRate === null ? "" : String(q.passRate),
        q.highestPercent === null ? "" : String(q.highestPercent),
        q.lowestPercent === null ? "" : String(q.lowestPercent),
      ]);
      return csvResponse(toCsv(["Quiz", "Course", "Tried", "Attempts", "Avg %", "Pass %", "High %", "Low %"], rows), "quizzes.csv");
    }
    case "support": {
      if (!abilities.support) return deny();
      const d = await getSupportAnalytics(ctx);
      const rows = d.byCategory.map((c) => [
        c.category,
        c.count,
        c.resolved,
        c.avgResolutionMs === null ? "" : String(c.avgResolutionMs),
      ]);
      return csvResponse(toCsv(["Category", "Tickets", "Resolved", "Avg resolution (ms)"], rows), "support.csv");
    }
    default:
      return NextResponse.json({ success: false, error: "Unknown export type" }, { status: 400 });
  }
}

function deny(): NextResponse {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}