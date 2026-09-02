import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignments, getOfficeAssignmentById } from "@/lib/office/assignments/queries";
import { createAssignment, updateAssignment, deleteAssignment } from "@/lib/office/assignments/mutations";
import { getAssignmentModules, getModuleLessons } from "@/lib/office/assignments/mutations";
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  assignmentFiltersSchema,
} from "@/lib/office/assignments/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = assignmentFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const vp = parsed.data;

    const filters = {
      search: vp.search,
      courseId: vp.courseId,
      moduleId: vp.moduleId,
      status: vp.status,
      deadlineFilter: vp.deadlineFilter,
      hasPendingSubmissions: vp.hasPendingSubmissions,
    };

    const sort = {
      field: vp.sort,
      direction: vp.direction,
    };

    const pagination = {
      page: vp.page,
      limit: vp.limit,
    };

    const result = await getOfficeAssignments(filters, sort, pagination, user.id, user.role);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Office assignments GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

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
    const action = formData.get("action") as string;

    if (action === "create") {
      const data = {
        courseId: formData.get("courseId") as string,
        moduleId: formData.get("moduleId") as string | null,
        lessonId: formData.get("lessonId") as string | null,
        title: formData.get("title") as string,
        instructions: formData.get("instructions") as string,
        dueAt: formData.get("dueAt") as string | null,
        maxScore: parseInt(formData.get("maxScore") as string, 10),
        isPublished: formData.get("isPublished") === "true",
      };

      const validated = createAssignmentSchema.parse(data);

      const result = await createAssignment(validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, assignmentId: result.assignmentId });
    }

    if (action === "modules") {
      const courseId = formData.get("courseId") as string;
      if (!courseId) {
        return NextResponse.json({ success: false, error: "Course ID required" }, { status: 400 });
      }
      const modules = await getAssignmentModules(courseId);
      return NextResponse.json({ modules });
    }

    if (action === "lessons") {
      const moduleId = formData.get("moduleId") as string;
      if (!moduleId) {
        return NextResponse.json({ success: false, error: "Module ID required" }, { status: 400 });
      }
      const lessons = await getModuleLessons(moduleId);
      return NextResponse.json({ lessons });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office assignments POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}