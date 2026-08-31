import { NextRequest, NextResponse } from "next/server";

import {
  resourcePlacementSchema,
  resourceUploadMetaSchema,
} from "@/lib/resources/validation";
import { uploadResource } from "@/lib/resources/upload";
import {
  requireResourceManagerOrResponse,
  toResourceErrorResponse,
} from "@/lib/resources/http";

export const runtime = "nodejs";

/**
 * POST /api/office/resources — secure, server-side resource upload.
 * Staff-only (role read from the session). The Cloudinary API secret never
 * leaves the server; the browser only posts multipart form data here.
 */
export async function POST(request: NextRequest) {
  const auth = await requireResourceManagerOrResponse();
  if ("response" in auth) return auth.response;

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Please choose a file to upload." },
        { status: 400 }
      );
    }

    const placement = resourcePlacementSchema.safeParse({
      courseId: formData.get("courseId"),
      moduleId: formData.get("moduleId"),
      lessonId: formData.get("lessonId"),
    });
    if (!placement.success) {
      return NextResponse.json(
        { success: false, error: "Select a course, module and lesson." },
        { status: 400 }
      );
    }

    const meta = resourceUploadMetaSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      access: formData.get("access") || undefined,
      isPublished: formData.get("isPublished") || undefined,
      order: formData.get("order") || undefined,
    });
    if (!meta.success) {
      return NextResponse.json(
        { success: false, error: "Invalid resource details. Please review the form." },
        { status: 400 }
      );
    }

    const result = await uploadResource({
      staffId: auth.staff.id,
      file,
      courseId: placement.data.courseId,
      moduleId: placement.data.moduleId,
      lessonId: placement.data.lessonId,
      title: meta.data.title,
      description: meta.data.description,
      access: meta.data.access,
      isPublished: meta.data.isPublished,
      order: meta.data.order,
    });

    return NextResponse.json({ success: true, resource: result }, { status: 201 });
  } catch (error) {
    return toResourceErrorResponse(error);
  }
}
