import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentCertificate } from "./queries";
import type { CertificateDetail } from "@/types/certificate";

type RouteContext = { params: Promise<{ certificateId: string }> };

/**
 * Shared guard for the private student certificate download route.
 *
 * Authenticates the student, then loads the certificate with an ownership
 * filter (`student` must match the session). Missing / foreign certificates
 * look identical to the client (404), so swapping a certificateId never leaks
 * another student's PDF (spec §47–§48).
 */
export async function requireStudentCertificateOrResponse(
  ctx: RouteContext
): Promise<
  | { detail: CertificateDetail; certificateId: string }
  | { response: NextResponse }
> {
  const { user } = await getValidatedStudent();
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const parsed = await ctx.params;
  const { certificateId } = parsed;

  let detail;
  try {
    detail = await getStudentCertificate(user.id, certificateId);
  } catch {
    detail = null;
  }

  if (!detail || !detail.pdfUrl) {
    return {
      response: NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      ),
    };
  }

  return { detail, certificateId };
}

/** Safe, professional download filename: certificate-courseName-number.pdf. */
export function certificateDownloadFileName(detail: {
  courseName: string;
  certificateNumber: string;
}): { ascii: string; encoded: string } {
  const slug = detail.courseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "certificate";
  const number = detail.certificateNumber.replace(/[^A-Za-z0-9_-]/g, "");
  const ascii = `certificate-${slug}-${number}.pdf`;
  return { ascii, encoded: encodeURIComponent(ascii) };
}