import { NextResponse } from "next/server";

import { requireAdminForCertificates } from "@/lib/office/certificates/http";
import { certificateNumberExists } from "@/lib/office/certificates/queries";
import { generateManualCertificateNumber } from "@/lib/certificates/ids";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/office/certificates/generate-number — ADMIN ONLY.
 *
 * Reserves the next value from the atomic per-(type, year) counter and returns
 * a formatted, unused certificate number. The counter guarantees two
 * concurrent admins never receive the same value; this handler additionally
 * verifies the result is free before handing it out (a number can be entered
 * manually in another tab and collide with the sequence).
 */
export async function POST() {
  const guard = await requireAdminForCertificates();
  if (guard.response) return guard.response;

  try {
    let certificateNumber = await generateManualCertificateNumber();
    // Extremely unlikely, but cheap: skip any value already taken manually.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      if (!(await certificateNumberExists(certificateNumber))) break;
      certificateNumber = await generateManualCertificateNumber();
    }

    return NextResponse.json(
      { success: true, certificateNumber },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not generate a certificate number." },
      { status: 500 }
    );
  }
}
