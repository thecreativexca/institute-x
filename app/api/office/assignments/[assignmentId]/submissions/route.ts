import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeSubmissions, getOfficeSubmissionDetail } from "@/lib/office/assignments/queries";
import { gradeSubmission } from "@/lib/office/assignments/mutations";
import { gradeSubmissionSchema, submissionFiltersSchema } from "@/lib/office/assignments/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { assignmentId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const paramsObj = Object.fromEntries(searchParams.entries());

    const parsedFilters = submissionFiltersSchema.safeParse(paramsObj);
    if (!parsedFilters.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsedFilters.error }, { status: 400 });
    }

    const vp = parsedFilters.data;

    const filters = {
      search: vp.search,
      status: vp.status,
    };

    const sort = {
      field: vp.sort,
      direction: vp.direction,
    };

    const pagination = {
      page: vp.page,
      limit: vp.limit,
    };

    const result = await getOfficeSubmissions(assignmentId, filters, sort, pagination, user.id, user.role);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Office submissions GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}