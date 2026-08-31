import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAnnouncementById } from "@/lib/office/announcements/queries";
import { updateAnnouncement, deleteAnnouncement, archiveAnnouncement } from "@/lib/office/announcements/mutations";
import { updateAnnouncementSchema } from "@/lib/office/announcements/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { announcementId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const announcement = await getOfficeAnnouncementById(announcementId);

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Office announcement GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { announcementId } = await params;

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

    if (action === "archive") {
      const result = await archiveAnnouncement(announcementId, user.id, user.role);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    const data = {
      title: formData.get("title") as string | undefined,
      body: formData.get("body") as string | undefined,
      audience: formData.get("audience") as string | undefined,
      courseId: formData.get("courseId") as string | null | undefined,
      isActive: formData.get("isActive") === "true" ? true : formData.get("isActive") === "false" ? false : undefined,
      sendEmail: formData.get("sendEmail") === "true" ? true : undefined,
    };

    const validated = updateAnnouncementSchema.parse(data);

    const result = await updateAnnouncement(announcementId, validated, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office announcement PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ announcementId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { announcementId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const result = await deleteAnnouncement(announcementId, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Office announcement DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}