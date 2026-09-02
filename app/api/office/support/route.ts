import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeSupportTickets, getSupportStats } from "@/lib/support/queries";
import { supportFiltersSchema } from "@/lib/support/validation";

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

    if (!hasPermission(user.role, PERMISSIONS.SUPPORT_READ)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = supportFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const vp = parsed.data;

    const filters = {
      search: vp.search,
      status: vp.status,
      priority: vp.priority,
      category: vp.category,
      assignedToMe: vp.assignedToMe,
      unassigned: vp.unassigned,
      courseId: vp.courseId,
    };

    const sort = {
      field: vp.sort,
      direction: vp.direction,
    };

    const pagination = {
      page: vp.page,
      limit: vp.limit,
    };

    const [result, stats] = await Promise.all([
      getOfficeSupportTickets(filters, sort, pagination, user.id, user.role),
      getSupportStats(),
    ]);

    return NextResponse.json({ ...result, stats });
  } catch (error) {
    console.error("Office support GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}