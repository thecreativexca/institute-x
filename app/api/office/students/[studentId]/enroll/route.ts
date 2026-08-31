import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { createManualEnrollment } from "@/lib/office/students/mutations";
import { manualEnrollmentSchema } from "@/lib/office/students/validation";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ENROLLMENTS_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    if (!Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    const body = await request.json();
    const validated = manualEnrollmentSchema.parse({
      studentId,
      courseId: body.courseId,
      source: body.source ?? "MANUAL",
      reason: body.reason,
      // enrolledBy always comes from the authenticated session, never the client.
      enrolledBy: user.id,
    });

    const result = await createManualEnrollment(validated);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, enrollmentId: result.enrollmentId });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed" }, { status: 400 });
    }
    console.error("Office manual enrollment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
