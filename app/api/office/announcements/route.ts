import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAnnouncements } from "@/lib/office/announcements/queries";
import { createAnnouncement } from "@/lib/office/announcements/mutations";
import { Course } from "@/models/Course";
import { createAnnouncementSchema, announcementFiltersSchema } from "@/lib/office/announcements/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = announcementFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const vp = parsed.data;

    const filters = {
      search: vp.search,
      audience: vp.audience,
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

    const result = await getOfficeAnnouncements(filters, sort, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Office announcements GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action === "create") {
      const data = {
        title: formData.get("title") as string,
        body: formData.get("body") as string,
        audience: formData.get("audience") as string,
        courseId: formData.get("courseId") as string | null,
        isActive: formData.get("isActive") === "true",
        sendEmail: formData.get("sendEmail") === "true",
      };

      const validated = createAnnouncementSchema.parse(data);

      const result = await createAnnouncement(validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, announcementId: result.announcementId });
    }

    if (action === "courses") {
      const courses = await Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean();
      const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));
      return NextResponse.json({ courses: courseOptions });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office announcements POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}