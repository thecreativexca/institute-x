import { NextRequest, NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { issueCertificateForEnrollment } from "@/lib/certificates/issue";
import { toCertificateErrorResponse } from "@/lib/certificates/errors";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * POST /api/student/certificates/[certificateId]/issue
 *
 * Idempotent, secure Generate-Certificate action (spec §13, §45).
 * The server resolves the enrollment from the URL parameter (named certificateId
 * for consistency with the student certificate page dynamic segment), verifies
 * the authenticated student owns it, re-evaluates completion eligibility through Phase 11, and
 * only then issues a PDF-backed certificate. Nothing is trusted from the body.
 * The client passes the enrollmentId as the certificateId segment value for this endpoint.
 */
export async function POST(_request: NextRequest, ctx: RouteContext) {
  const { user, error } = await getValidatedStudent();
  if (!user || error) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const { certificateId } = await ctx.params;

  try {
    const certificate = await issueCertificateForEnrollment({
      enrollmentId: certificateId,
      actorId: user.id,
      actorRole: user.role,
    });
    return NextResponse.json({ success: true, certificate }, { status: 200 });
  } catch (err) {
    return toCertificateErrorResponse(err);
  }
}