import { NextRequest, NextResponse } from "next/server";

import { RESOURCE_ACCESS } from "@/lib/constants";
import { buildInlineUrl } from "@/lib/resources/cloudinary";
import {
  requireStudentResourceOrResponse,
  studentDownloadFileName,
} from "@/lib/resources/download";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ resourceId: string }> };

/**
 * GET /api/student/resources/[resourceId]/download — controlled download.
 *
 * Full student access chain (session role, enrollment, relationship
 * integrity, published state, access policy) is enforced before the file
 * streams through the server with `Content-Disposition: attachment`.
 * VIEW_ONLY / PRIVATE resources are never served from this route.
 */
export async function GET(request: NextRequest, ctx: RouteContext) {
  const auth = await requireStudentResourceOrResponse(ctx);
  if ("response" in auth) return auth.response;

  const { resource } = auth.context;

  // The intended access flow: only explicitly downloadable resources are
  // served through this route. (Browsers cannot be relied on to prevent a
  // determined user from saving content — the app only controls intent.)
  if (resource.access !== RESOURCE_ACCESS.VIEW_AND_DOWNLOAD) {
    return NextResponse.json(
      {
        success: false,
        error: "This resource can be viewed online but is not downloadable.",
      },
      { status: 403 }
    );
  }

  try {
    // fl_inline ensures Cloudinary does not force its own attachment header;
    // our response supplies the download headers instead.
    const upstream = await fetch(buildInlineUrl(resource.fileUrl), {
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      console.error("Resource download upstream failed:", upstream.status);
      return NextResponse.json(
        { success: false, error: "Unable to open this resource." },
        { status: 502 }
      );
    }

    const fileName = studentDownloadFileName(resource);

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": resource.mimeType,
        "Content-Length": String(upstream.headers.get("content-length") ?? ""),
        "Content-Disposition": `attachment; filename="${fileName.ascii}"; filename*=UTF-8''${fileName.encoded}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Resource download failed:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { success: false, error: "Unable to open this resource." },
      { status: 500 }
    );
  }
}
