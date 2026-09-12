import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
  validationError,
} from "@/lib/office/certificates/http";
import { revokeCertificate } from "@/lib/office/certificates/service";
import {
  certificateIdParamSchema,
  certificateRevokeSchema,
} from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * PATCH /api/office/certificates/[certificateId]/revoke — ADMIN ONLY.
 *
 * Marks the certificate revoked and stores the reason. The record and the file
 * are never deleted, so public verification can still report "Certificate
 * Revoked" instead of a confusing "not found".
 */
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsedParams = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsedParams.success) return badRequest("Invalid certificate id.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const parsed = certificateRevokeSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed);

  try {
    const certificate = await revokeCertificate({
      certificateId: parsedParams.data.certificateId,
      reason: parsed.data.reason,
      actor: guard.actor,
    });
    return NextResponse.json(
      { success: true, message: "Certificate revoked successfully.", certificate },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
