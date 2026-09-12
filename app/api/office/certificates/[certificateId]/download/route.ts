import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
} from "@/lib/office/certificates/http";
import { getCertificateFileRef } from "@/lib/office/certificates/queries";
import { certificateIdParamSchema } from "@/lib/office/certificates/validation";
import {
  extensionForMimeType,
  streamCertificateFile,
} from "@/lib/certificates/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/office/certificates/[certificateId]/download — ADMIN ONLY.
 *
 * Streams the stored file through the server with `Content-Disposition:
 * attachment`. The Cloudinary delivery URL never reaches the browser.
 *
 * Unlike the student route, an admin may still download a REVOKED certificate:
 * they are the ones who have to inspect it when resolving a dispute.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsed.success) return badRequest("Invalid certificate id.");

  try {
    const ref = await getCertificateFileRef(parsed.data.certificateId);
    if (!ref) {
      return NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      );
    }

    return await streamCertificateFile({
      fileUrl: ref.pdfUrl,
      mimeType: ref.fileType,
      fileName: ref.certificateNumber,
      extension: extensionForMimeType(ref.fileType),
      disposition: "attachment",
    });
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
