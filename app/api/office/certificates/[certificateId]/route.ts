import { NextRequest, NextResponse } from "next/server";

import {
  badRequest,
  requireAdminForCertificates,
  toCertificateErrorResponse,
  validationError,
} from "@/lib/office/certificates/http";
import { getOfficeCertificate } from "@/lib/office/certificates/queries";
import { deleteCertificate, updateCertificate } from "@/lib/office/certificates/service";
import {
  certificateIdParamSchema,
  certificateUpdateSchema,
} from "@/lib/office/certificates/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * /api/office/certificates/[certificateId] — ADMIN ONLY.
 *
 *   GET    — full admin record (includes the internal `notes` field).
 *   PATCH  — update descriptive metadata (never the stored file).
 *   DELETE — permanently remove the record and its Cloudinary file.
 *
 * The id is validated as an ObjectId before any database call, so a malformed
 * id is a clean 400 rather than a Mongoose CastError.
 */

export async function GET(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsed.success) return badRequest("Invalid certificate id.");

  try {
    const certificate = await getOfficeCertificate(parsed.data.certificateId);
    if (!certificate) {
      return NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, certificate }, { status: 200 });
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}

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

  const parsed = certificateUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed);

  try {
    const certificate = await updateCertificate({
      certificateId: parsedParams.data.certificateId,
      input: parsed.data,
      actor: guard.actor,
    });
    return NextResponse.json(
      { success: true, message: "Certificate updated successfully.", certificate },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  const parsed = certificateIdParamSchema.safeParse(await ctx.params);
  if (!parsed.success) return badRequest("Invalid certificate id.");

  try {
    const result = await deleteCertificate({
      certificateId: parsed.data.certificateId,
      actor: guard.actor,
    });
    return NextResponse.json(
      {
        success: true,
        message: `Certificate ${result.certificateNumber} deleted successfully.`,
      },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
