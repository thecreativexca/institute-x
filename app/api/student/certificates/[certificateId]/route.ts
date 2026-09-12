import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { toCertificateErrorResponse } from "@/lib/certificates/errors";
import { getStudentCertificate } from "@/lib/certificates/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/student/certificates/[certificateId] — one of MY certificates.
 *
 * Ownership is enforced in the query itself: the document is looked up by
 * `_id` AND `student: sessionUserId`. Another student's certificate is
 * indistinguishable from a non-existent one (404), so the endpoint cannot be
 * used to probe which certificate ids exist (spec §12, §20).
 */
export async function GET(_request: Request, ctx: RouteContext) {
  const { user, error } = await getValidatedStudent();
  if (!user || error) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const { certificateId } = await ctx.params;

  try {
    const certificate = await getStudentCertificate(user.id, certificateId);
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
