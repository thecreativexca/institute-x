import { getCertificateVerificationUrl } from "./verification-url";
import type { CertificateDetail, CertificateListItem } from "@/types/certificate";
import type { ICertificate } from "@/models/Certificate";

/**
 * Maps raw certificate documents to client-safe DTOs. Only snapshot + public
 * fields cross the boundary — never emails, internal ids or metadata.
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
  >
): CertificateListItem {
  return {
    id: cert._id.toString(),
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode,
    courseName: cert.courseNameSnapshot,
    issuedAt: cert.issuedAt.toISOString(),
    completionDate: cert.completionDate.toISOString(),
    status: cert.status,
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
    | "pdfUrl"
    | "revokedAt"
  >
): CertificateDetail {
  return {
    ...certificateToListItem(cert),
    studentName: cert.studentNameSnapshot,
    verificationUrl: getCertificateVerificationUrl(cert.verificationCode),
    pdfUrl: cert.pdfUrl,
    revokedAt: cert.revokedAt?.toISOString() ?? null,
  };
}