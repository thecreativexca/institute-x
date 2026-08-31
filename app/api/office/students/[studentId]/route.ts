import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { updateStudentProfile, updateStudentStatus } from "@/lib/office/students/mutations";
import { profileUpdateSchema, studentStatusSchema } from "@/lib/office/students/validation";

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

    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action === "update") {
      if (!hasPermission(user.role, PERMISSIONS.STUDENTS_UPDATE)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const data = {
        name: formData.get("name") as string | undefined,
        email: formData.get("email") as string | undefined,
        phone: formData.get("phone") as string | undefined,
      };

      const validated = profileUpdateSchema.parse(data);

      const result = await updateStudentProfile(studentId, validated, user.id, user.role);

      if (!result) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, student: result });
    }

    if (action === "status") {
      if (!hasPermission(user.role, PERMISSIONS.STUDENTS_STATUS)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const data = {
        studentId,
        status: formData.get("status") as string,
        reason: formData.get("reason") as string | undefined,
      };

      const validated = studentStatusSchema.parse(data);

      const result = await updateStudentStatus(validated, user.id, user.role);

      if (!result) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, student: result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office student API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}