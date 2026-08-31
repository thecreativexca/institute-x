import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizResults, getOfficeQuizResultDetail } from "@/lib/office/quizzes/queries";
import { resultFiltersSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZ_RESULTS_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const paramsObj = Object.fromEntries(searchParams.entries());

    const parsedFilters = resultFiltersSchema.safeParse(paramsObj);
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

    const result = await getOfficeQuizResults(quizId, filters, sort, pagination, user.id, user.role);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Office quiz results GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}