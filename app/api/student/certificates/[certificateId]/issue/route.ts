import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/student/certificates/[certificateId]/issue — REMOVED.
 *
 * Students may only VIEW, DOWNLOAD and VERIFY their certificates. Certificates
 * are issued exclusively by the institute through the admin Certificate
 * Management module (`/api/office/certificates`), where an admin selects the
 * student and uploads the certificate file.
 *
 * The route is kept as an explicit, always-refusing endpoint (rather than
 * deleted silently) so any stale client, bookmark or cached bundle that still
 * calls it receives a clear 403 instead of a confusing 404 — and, critically,
 * so that no call path can ever mint a certificate on a student's own behalf.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Certificates are issued by the institute. You will be notified once your certificate is available.",
    },
    { status: 403 }
  );
}
