import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
} from "@/lib/office/certificates/http";
import { replaceCertificateFile } from "@/lib/office/certificates/service";
import { certificateIdParamSchema } from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * PATCH /api/office/certificates/[certificateId]/replace — ADMIN ONLY.
 *
 * Swaps the stored file for a new upload while keeping the same record, the
 * same certificate number, and the full status history. The previous Cloudinary
 * asset is deleted only after the new one is safely persisted.
 */
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsedParams = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsedParams.success) return badRequest("Invalid certificate id.");

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("Expected multipart form data.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return badRequest("Please choose a replacement file (PDF, JPG or PNG).");
  }

  try {
    const certificate = await replaceCertificateFile({
      certificateId: parsedParams.data.certificateId,
      file,
      actor: guard.actor,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Certificate replaced successfully.",
        certificate,
      },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
