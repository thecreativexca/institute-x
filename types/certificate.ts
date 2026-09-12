import type { CertificateStatus, CertificateType } from "@/lib/constants";

/**
 * Client-safe DTO types for the certificate system (Phase 12).
 * Plain JSON only — never leaks driver internals, emails, ids or metadata.
 */

export interface CertificateListItem {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  /** Display title, e.g. "Full Stack Web Development Certificate". */
  certificateTitle: string | null;
  courseName: string;
  issuedAt: string;
  /** Null when an admin-uploaded certificate records no completion date. */
  completionDate: string | null;
  status: CertificateStatus;
  certificateType: CertificateType;
  /** Grade/score text, e.g. "A+", "92%", "Excellent". */
  grade: string | null;
  /** MIME type of the stored file (application/pdf, image/png, …). */
  fileType: string | null;
}

export interface CertificateDetail extends CertificateListItem {
  studentName: string;
  verificationUrl: string;
  /**
   * True when a stored file exists.
   *
   * The file itself is deliberately NOT represented by a URL: every view and
   * download is proxied through an ownership-checked API route, so the
   * underlying storage URL never reaches the browser.
   */
  hasFile: boolean;
  revokedAt: string | null;
  /** Reason shown to the owner when their certificate was revoked. */
  revocationReason: string | null;
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
  /** Display title of the certificate, e.g. "Advanced Excel Certification". */
  certificateTitle?: string | null;
  certificateNumber?: string;
  issueDate?: string;
  /** Null when the certificate records no completion date. */
  completionDate?: string | null;
  instituteName?: string;
  /** Only present when status === "revoked". */
  revokedAt?: string | null;
}
