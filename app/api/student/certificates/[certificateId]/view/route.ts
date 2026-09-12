import { NextRequest, NextResponse } from "next/server";

import { requireStudentCertificateOrResponse } from "@/lib/certificates/download";
import { extensionForMimeType, streamCertificateFile } from "@/lib/certificates/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/student/certificates/[certificateId]/view
 *
 * In-site preview of the owning student's certificate file, streamed `inline`
 * so the detail page can embed it in an <iframe> (PDF) or <img> (JPG/PNG).
 *
 * Serving it through the server (rather than handing the client a storage URL)
 * is what keeps the file private: the URL in the DOM is this ownership-checked
 * endpoint, and a revoked certificate is refused the same way a download is.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireStudentCertificateOrResponse(ctx);
  if ("response" in guard) return guard.response;

  if (guard.status === "revoked") {
    return NextResponse.json(
      { success: false, error: "This certificate has been revoked." },
      { status: 403 }
    );
  }

  return streamCertificateFile({
    fileUrl: guard.fileUrl,
    mimeType: guard.fileType,
    fileName: guard.certificateNumber,
    extension: extensionForMimeType(guard.fileType),
    disposition: "inline",
  });
}
