import { NextRequest, NextResponse } from "next/server";

import { getValidatedSession } from "@/lib/auth/helpers";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS } from "@/lib/constants";
import { isScopedToCourse } from "@/lib/office/courses/permissions";
import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import {
  ALLOWED_THUMBNAIL_MIME_TYPES,
  MAX_THUMBNAIL_SIZE_MB,
  deleteThumbnailAsset,
  uploadThumbnailAsset,
  buildThumbnailDeliveryUrl,
} from "@/lib/resources/thumbnails";
import { recordAuditEvent } from "@/lib/audit/log";
import { env } from "@/lib/config/env";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ courseId: string }> };

/**
 * POST /api/office/courses/[courseId]/thumbnail — Cloudinary course image
 * upload (Phase 17, req. 23–24). Server validates type/size and permission;
 * the old image is only deleted AFTER the new one is stored and the DB is
 * updated (replacement never loses the existing thumbnail on failure).
 */
export async function POST(request: NextRequest, ctx: RouteContext) {
  const { user } = await getValidatedSession();
  if (!user) {
    return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
  }

  const { courseId } = await ctx.params;
  if (
    !hasPermission(user.role, PERMISSIONS.COURSES_UPDATE) ||
    !(await isScopedToCourse(user, courseId))
  ) {
    return NextResponse.json(
      { success: false, error: "You do not have permission to update this course." },
      { status: 403 }
    );
  }

  try {
    await connectDB();

    const course = await Course.findById(toObjectId(courseId)).select("thumbnailPublicId");
    if (!course) {
      return NextResponse.json({ success: false, error: "Course not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "Please choose an image." }, { status: 400 });
    }

    const mimeType = (file.type || "").toLowerCase();
    if (!ALLOWED_THUMBNAIL_MIME_TYPES.includes(mimeType as (typeof ALLOWED_THUMBNAIL_MIME_TYPES)[number])) {
      return NextResponse.json(
        { success: false, error: "Only JPG, JPEG, PNG or WebP images are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_THUMBNAIL_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: `Images must be ${MAX_THUMBNAIL_SIZE_MB} MB or smaller.` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await uploadThumbnailAsset({ buffer, courseId });

    const previousPublicId = course.thumbnailPublicId;
    course.thumbnailUrl = buildThumbnailDeliveryUrl(asset.publicId);
    course.thumbnailPublicId = asset.publicId;
    course.updatedBy = toObjectId(user.id);
    await course.save();

    if (previousPublicId && previousPublicId !== asset.publicId) {
      const deleted = await deleteThumbnailAsset(previousPublicId);
      if (!deleted) {
        console.error("Orphaned previous course thumbnail:", previousPublicId);
      }
    }

    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "course.thumbnail_update",
      entityType: "course",
      entityId: courseId,
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl: course.thumbnailUrl,
    });
  } catch (error) {
    console.error("Thumbnail upload failed:", error);
    return NextResponse.json(
      { success: false, error: "The image could not be uploaded. Please try again." },
      { status: 500 }
    );
  }
}
