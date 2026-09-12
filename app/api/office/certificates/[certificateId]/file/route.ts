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
 * GET /api/office/certificates/[certificateId]/file — ADMIN ONLY.
 *
 * Same stored file as `/download`, but streamed `inline` so the admin viewer
 * can render it in an <iframe> (PDF) or <img> (JPG/PNG). Delivery through the
 * server keeps the Cloudinary URL out of the DOM and out of browser history.
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
      disposition: "inline",
    });
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
