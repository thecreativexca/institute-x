import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
} from "@/lib/office/certificates/http";
import { reactivateCertificate } from "@/lib/office/certificates/service";
import { certificateIdParamSchema } from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * PATCH /api/office/certificates/[certificateId]/reactivate — ADMIN ONLY.
 *
 * Restores a revoked certificate to issued. The stored file is left untouched,
 * and the original revocation reason is kept on the record as history.
 */
export async function PATCH(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsedParams = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsedParams.success) return badRequest("Invalid certificate id.");

  try {
    const certificate = await reactivateCertificate({
      certificateId: parsedParams.data.certificateId,
      actor: guard.actor,
    });
    return NextResponse.json(
      {
        success: true,
        message: "Certificate reactivated successfully.",
        certificate,
      },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
