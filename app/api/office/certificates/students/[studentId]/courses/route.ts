import { NextResponse } from "next/server";
import { z } from "zod";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
} from "@/lib/office/certificates/http";
import {
  getStudentOption,
  listIssuableEnrollments,
  listStudentCourseOptions,
} from "@/lib/office/certificates/queries";
import { objectIdSchema } from "@/lib/validations/common";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ studentId: string }> };

const paramsSchema = z.object({ studentId: objectIdSchema });

/**
 * GET /api/office/certificates/students/[studentId]/courses — ADMIN ONLY.
 *
 * Returns the courses a student is enrolled in (for the course selector) plus
 * their completed-but-not-yet-certified enrollments (for the optional
 * admin-triggered generated certificate path).
 *
 * Both lists are derived from the DATABASE for the student id in the path; the
 * client never supplies enrollment or course data of its own.
 */
export async function GET(_request: Request, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = paramsSchema.safeParse(await ctx.params);
  if (!parsed.success) return badRequest("Invalid student id.");

  try {
    const studentId = parsed.data.studentId;
    const [student, courses, issuable] = await Promise.all([
      getStudentOption(studentId),
      listStudentCourseOptions(studentId),
      listIssuableEnrollments(studentId),
    ]);

    if (!student) {
      return NextResponse.json(
        { success: false, error: "The selected student could not be found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, student, courses, issuableEnrollments: issuable },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
