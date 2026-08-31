import type { CertificateStatus } from "@/lib/constants";

/**
 * Client-safe DTO types for the certificate system (Phase 12).
 * Plain JSON only — never leaks driver internals, emails, ids or metadata.
 */

export interface CertificateListItem {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  courseName: string;
  issuedAt: string;
  completionDate: string;
  status: CertificateStatus;
}

export interface CertificateDetail extends CertificateListItem {
  studentName: string;
  verificationUrl: string;
  pdfUrl: string;
  revokedAt: string | null;
}

/** A completed enrollment that is certificate-ready but not yet issued. */
export interface EligibleEnrollment {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  completionDate: string;
}

/** Public verification outcome (spec §28–§31). */
export type PublicVerificationStatus = "valid" | "revoked" | "not_found";

export interface PublicVerificationResult {
  status: PublicVerificationStatus;
  studentName?: string;
  courseName?: string;
  certificateNumber?: string;
  issueDate?: string;
  completionDate?: string;
  instituteName?: string;
  /** Only present when status === "revoked". */
  revokedAt?: string | null;
}