import { getCertificateVerificationUrl } from "./verification-url";
import type { CertificateDetail, CertificateListItem } from "@/types/certificate";
import type { ICertificate } from "@/models/Certificate";

/**
 * Maps raw certificate documents to client-safe DTOs. Only snapshot + public
 * fields cross the boundary — never emails, internal ids or metadata.
 *
 * `notes` is admin-only and carries `select: false` on the schema; it is
 * deliberately absent from both DTOs so it can never reach a student surface.
 */
export function certificateToListItem(
  cert: Pick<
    ICertificate,
    | "_id"
    | "certificateNumber"
    | "verificationCode"
    | "courseNameSnapshot"
    | "issuedAt"
    | "completionDate"
    | "status"
    | "certificateType"
  > &
    Partial<Pick<ICertificate, "certificateTitle" | "grade" | "fileType">>
): CertificateListItem {
  return {
    id: cert._id.toString(),
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    certificateTitle: cert.certificateTitle ?? null,
    courseName: cert.courseNameSnapshot,
    issuedAt: cert.issuedAt.toISOString(),
    // Optional for admin-uploaded certificates, which need not record one.
    completionDate: cert.completionDate?.toISOString() ?? null,
    status: cert.status,
    certificateType: cert.certificateType ?? "course_completion",
    grade: cert.grade ?? null,
    fileType: cert.fileType ?? "application/pdf",
  };
}

export function certificateToDetail(
  cert: Pick<
    ICertificate,
    | "_id"
    | "certificateNumber"
    | "verificationCode"
    | "courseNameSnapshot"
    | "studentNameSnapshot"
    | "issuedAt"
    | "completionDate"
    | "status"
    | "certificateType"
    | "revokedAt"
    | "revocationReason"
  > &
    Partial<Pick<ICertificate, "certificateTitle" | "grade" | "fileType" | "pdfUrl">>
): CertificateDetail {
  return {
    ...certificateToListItem(cert),
    studentName: cert.studentNameSnapshot,
    verificationUrl: getCertificateVerificationUrl(cert.verificationCode),
    // Only a boolean crosses the boundary; the storage URL stays server-side.
    hasFile: Boolean(cert.pdfUrl),
    revokedAt: cert.revokedAt?.toISOString() ?? null,
    revocationReason: cert.revocationReason ?? null,
  };
}
