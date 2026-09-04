import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignmentById } from "@/lib/office/assignments/queries";
import { updateAssignment, deleteAssignment } from "@/lib/office/assignments/mutations";
import { updateAssignmentSchema } from "@/lib/office/assignments/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const assignment = await getOfficeAssignmentById(assignmentId, user.id, user.role);

    if (!assignment) {
      return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Office assignment GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_MANAGE)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();

    // datetime-local submits a naive string (e.g. "2026-09-10T14:30") that
    // z.string().datetime() rejects. Normalize to a full ISO instant; keep
    // undefined = "not provided" distinct from null = "explicitly cleared".
    const rawDueAt = formData.get("dueAt") as string | null;
    let dueAt: string | null | undefined;
    if (rawDueAt === null) {
      dueAt = undefined;
    } else if (rawDueAt === "") {
      dueAt = null;
    } else {
      const parsed = new Date(rawDueAt);
      dueAt = Number.isNaN(parsed.getTime()) ? rawDueAt : parsed.toISOString();
    }

    const data = {
      title: formData.get("title") as string | undefined,
      instructions: formData.get("instructions") as string | undefined,
      dueAt,
      maxScore: formData.get("maxScore") ? parseInt(formData.get("maxScore") as string, 10) : undefined,
      moduleId: formData.get("moduleId") as string | null | undefined,
      lessonId: formData.get("lessonId") as string | null | undefined,
      isPublished: formData.get("isPublished") === "true" ? true : formData.get("isPublished") === "false" ? false : undefined,
    };

    const validated = updateAssignmentSchema.parse(data);

    const result = await updateAssignment(assignmentId, validated, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office assignment PATCH error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_MANAGE)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const result = await deleteAssignment(assignmentId, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Office assignment DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}