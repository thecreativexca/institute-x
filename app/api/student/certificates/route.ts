import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { toCertificateErrorResponse } from "@/lib/certificates/errors";
import { listStudentCertificates } from "@/lib/certificates/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/student/certificates — the authenticated student's certificates.
 *
 * The student id comes from the validated session ONLY (spec §4, §12). No
 * student id is accepted from the query string, body or headers, so a student
 * cannot ask for anyone else's list — there is simply no input that would let
 * them. Read-only: students have no create/upload/edit/delete endpoint at all.
 */
export async function GET() {
  const { user, error } = await getValidatedStudent();
  if (!user || error) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  try {
    const certificates = await listStudentCertificates(user.id);
    return NextResponse.json(
      { success: true, certificates, total: certificates.length },
      { status: 200 }
    );
  } catch (error) {
    return toCertificateErrorResponse(error);
  }
}
