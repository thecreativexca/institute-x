import { NextRequest, NextResponse } from "next/server";

import {
  certificateDownloadFileName,
  requireStudentCertificateOrResponse,
} from "@/lib/certificates/download";
import { streamCertificateFile } from "@/lib/certificates/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/student/certificates/[certificateId]/download
 *
 * Private, ownership-checked download (spec §25, §47–§48). The stored file
 * streams through the server with `Content-Disposition: attachment` and a
 * sanitized, professional filename. Swapping the certificateId cannot expose
 * another student's file because the guard filters by the session student.
 *
 * Downloads are REFUSED for revoked certificates (spec §7): a revoked document
 * must not be re-circulated as a valid copy. The student still sees the record
 * and its revocation notice on the detail page.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireStudentCertificateOrResponse(ctx);
  if ("response" in guard) return guard.response;

  if (guard.status === "revoked") {
    return NextResponse.json(
      {
        success: false,
        error: "This certificate has been revoked and can no longer be downloaded.",
      },
      { status: 403 }
    );
  }

  const fileName = certificateDownloadFileName({
    ...guard.detail,
    fileType: guard.fileType,
  });

  return streamCertificateFile({
    fileUrl: guard.fileUrl,
    mimeType: guard.fileType,
    // The friendly name already carries the extension from the MIME type.
    fileName: fileName.ascii.replace(/\.[a-z0-9]+$/, ""),
    extension: fileName.ascii.split(".").pop() ?? "pdf",
    disposition: "attachment",
  });
}
