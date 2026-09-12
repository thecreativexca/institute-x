import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentCertificate, getStudentCertificateFileRef } from "./queries";
import type { CertificateDetail } from "@/types/certificate";

type RouteContext = { params: Promise<{ certificateId: string }> };

/** Storage reference plus the metadata the student routes need. */
export interface StudentCertificateFile {
  detail: CertificateDetail;
  certificateId: string;
  fileUrl: string;
  fileType: string;
  /** Certificate status at the time of the request. */
  status: string;
  certificateNumber: string;
}

/**
 * Shared guard for the private student certificate file routes.
 *
 * Authenticates the student, then loads the certificate with an ownership
 * filter (`student` must match the session). Missing / foreign certificates
 * look identical to the client (404), so swapping a certificateId never leaks
 * another student's PDF (spec §47–§48).
 *
 * The storage URL is resolved here, server-side, and is returned to the route
 * handler only — it is never included in the DTO the browser receives.
 */
export async function requireStudentCertificateOrResponse(
  ctx: RouteContext
): Promise<StudentCertificateFile | { response: NextResponse }> {
  const { user } = await getValidatedStudent();
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const { certificateId } = await ctx.params;

  let detail: CertificateDetail | null = null;
  try {
    detail = await getStudentCertificate(user.id, certificateId);
  } catch {
    detail = null;
  }

  if (!detail) {
    return {
      response: NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      ),
    };
  }

  const ref = await getStudentCertificateFileRef(user.id, certificateId);
  if (!ref || !ref.pdfUrl) {
    return {
      response: NextResponse.json(
        { success: false, error: "Certificate not found." },
        { status: 404 }
      ),
    };
  }

  return {
    detail,
    certificateId,
    fileUrl: ref.pdfUrl,
    fileType: ref.fileType ?? "application/pdf",
    status: ref.status,
    certificateNumber: ref.certificateNumber,
  };
}

/**
 * Safe, professional download filename:
 * `certificate-{course-slug}-{number}.{ext}`.
 */
export function certificateDownloadFileName(detail: {
  courseName: string;
  certificateNumber: string;
  fileType?: string | null;
}): { ascii: string; encoded: string } {
  const slug =
    detail.courseName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "certificate";
  const number = detail.certificateNumber.replace(/[^A-Za-z0-9_-]/g, "");
  const extension =
    detail.fileType === "image/jpeg"
      ? "jpg"
      : detail.fileType === "image/png"
        ? "png"
        : "pdf";
  const ascii = `certificate-${slug}-${number}.${extension}`;
  return { ascii, encoded: encodeURIComponent(ascii) };
}
