import type { CertificateStatus, CertificateType } from "@/lib/constants";

/**
 * Server → client DTOs for the admin Certificate Management module.
 *
 * Plain JSON only. Internal Mongo ids are exposed **only** where the admin UI
 * genuinely needs them to address a row (`id`, `studentId`, `courseId`); the
 * admin is already authorized for the whole institute, so this is not a
 * privilege boundary like the student DTOs are.
 */
export interface OfficeCertificateRow {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  certificateTitle: string | null;
  studentId: string;
  studentName: string;
  courseId: string | null;
  courseName: string;
  issueDate: string;
  completionDate: string | null;
  grade: string | null;
  /** Admin-only internal note. Never surfaced outside the office portal. */
  notes: string | null;
  status: CertificateStatus;
  certificateType: CertificateType;
  fileType: string | null;
  fileSize: number | null;
  originalFileName: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  replacedAt: string | null;
  restoredAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfficeCertificateListResult {
  certificates: OfficeCertificateRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OfficeCertificateStats {
  total: number;
  active: number;
  revoked: number;
  issuedThisMonth: number;
}

/** Option shape for the admin student combobox and course selector. */
export interface CertificateOption {
  id: string;
  label: string;
  /** Secondary line in the combobox (email / course code). */
  hint?: string;
}

/** A completed enrollment that an admin can turn into a generated certificate. */
export interface CertificateEligibleEnrollmentOption {
  enrollmentId: string;
  courseId: string;
  courseName: string;
  completionDate: string;
  /** True when a certificate already exists for this enrollment. */
  alreadyIssued: boolean;
}
