import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  ADMIN_UPLOADED_CERTIFICATE_TYPES,
  CERTIFICATE_STATUSES,
  CERTIFICATE_TYPES,
  type CertificateStatus,
  type CertificateType,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";
import { Enrollment } from "./Enrollment";
import { User } from "./User";

/**
 * Certificate — issued when an eligible student completes a course (Phase 12),
 * or uploaded and assigned by an admin (admin Certificate Management module).
 *
 * Design principles:
 *   - One certificate per enrollment (unique `enrollment` index).
 *   - Snapshot fields (`studentNameSnapshot`, `courseNameSnapshot`,
 *     `completionDate`) are written at issuance so later course/title/profile
 *     edits never change an already-issued historical document.
 *   - `certificateNumber` (human-readable, sequential via atomic counter) and
 *     `verificationCode` (high-entropy, non-sequential, used in public URLs)
 *     are kept separate and both uniquely indexed.
 *   - The certificate file is immutable: `pdfUrl` / `pdfPublicId` are stored
 *     once and never silently regenerated on every page visit.
 *
 * Admin-uploaded certificates (`certificateType: "manual_upload"`) are the one
 * exception to "must belong to an enrollment": an admin may issue a
 * certificate for a student directly, without a linked Enrollment. They carry
 * the extra optional descriptive fields below (`certificateTitle`, `grade`,
 * `notes`, `fileType`, …); for generated certificates those stay null.
 */
export interface ICertificate {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  student: Types.ObjectId;
  course?: Types.ObjectId | null;
  enrollment?: Types.ObjectId | null;
  internshipEnrollment?: Types.ObjectId | null;
  certificateNumber: string;
  verificationCode: string;
  certificateType: CertificateType;
  studentNameSnapshot: string;
  courseNameSnapshot: string;
  issuedAt: Date;
  completionDate: Date;
  status: CertificateStatus;
  /** Stored certificate file (PDF or image). Kept as `pdfUrl` for compatibility. */
  pdfUrl: string;
  pdfPublicId: string;
  qrVerificationUrl: string;
  /** Free text record of the authorizing role/id at issuance. */
  issuedBy?: string;
  metadata?: Record<string, unknown>;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  revocationReason?: string | null;

  /* ------- Admin-uploaded certificate fields (all optional) -------------- */
  /** Display title, e.g. "Full Stack Web Development Certificate". */
  certificateTitle?: string | null;
  /** Free-text grade/score, e.g. "A+", "92%", "Excellent". */
  grade?: string | null;
  /** Admin-only internal note. NEVER exposed on public surfaces. */
  notes?: string | null;
  /** MIME type of the stored file (application/pdf, image/png, …). */
  fileType?: string | null;
  /** Stored file size in bytes. */
  fileSize?: number | null;
  /** Original upload filename, sanitized for display. */
  originalFileName?: string | null;
  /** Cloudinary resource_type used at upload ("raw" | "image"). */
  fileResourceType?: string | null;
  /** Admin who uploaded/assigned this certificate. */
  uploadedBy?: Types.ObjectId | null;
  /** When the file was last replaced (previous file deleted). */
  replacedAt?: Date | null;
  /** When a revoked certificate was restored to issued. */
  restoredAt?: Date | null;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      default: null,
    },
    internshipEnrollment: { type: Schema.Types.ObjectId, ref: "InternshipEnrollment", default: null },
    enrollment: {
      type: Schema.Types.ObjectId,
      ref: Enrollment.modelName,
      default: null,
    },
    certificateNumber: { type: String, required: true, unique: true },
    verificationCode: { type: String, required: true, unique: true },
    certificateType: {
      type: String,
      enum: Object.values(CERTIFICATE_TYPES),
      default: CERTIFICATE_TYPES.COURSE_COMPLETION,
      index: true,
    },
    studentNameSnapshot: { type: String, required: true, trim: true },
    courseNameSnapshot: { type: String, required: true, trim: true },
    issuedAt: { type: Date, default: () => new Date() },
    // Optional at the schema level so admin uploads (which may not know the
    // completion date) can be created; the pre-validate hook below still
    // requires it for every generated certificate type.
    completionDate: { type: Date, required: false, default: null },
    status: {
      type: String,
      enum: Object.values(CERTIFICATE_STATUSES),
      default: CERTIFICATE_STATUSES.ISSUED,
      index: true,
    },
    pdfUrl: { type: String, required: true },
    pdfPublicId: { type: String, required: true },
    qrVerificationUrl: { type: String, required: true },
    issuedBy: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed, default: undefined },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: String, default: null },
    revocationReason: { type: String, default: null },

    /* ------- Admin-uploaded certificate fields ------- */
    certificateTitle: { type: String, trim: true, maxlength: 200, default: null },
    grade: { type: String, trim: true, maxlength: 60, default: null },
    notes: { type: String, trim: true, maxlength: 1000, default: null, select: false },
    fileType: { type: String, trim: true, default: null },
    fileSize: { type: Number, min: 0, default: null },
    originalFileName: { type: String, trim: true, maxlength: 200, default: null },
    fileResourceType: { type: String, trim: true, default: null },
    uploadedBy: { type: Schema.Types.ObjectId, ref: User.modelName, default: null, index: true },
    replacedAt: { type: Date, default: null },
    restoredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Mongoose 9 middleware is promise-based: there is no `next` callback, so
// errors are reported by throwing inside the async hook.
CertificateSchema.pre("validate", async function () {
  const isAdminUpload = ADMIN_UPLOADED_CERTIFICATE_TYPES.includes(
    this.certificateType
  );

  if (isAdminUpload) {
    // Admin-uploaded certificates may stand alone (no enrollment) but must
    // always be attached to a student and carry a completion date.
    if (!this.student) {
      throw new Error("Certificate must belong to a student.");
    }
    if (!this.completionDate) this.completionDate = this.issuedAt ?? new Date();
    return;
  }

  if (!this.enrollment && !this.internshipEnrollment) {
    throw new Error("Certificate must belong to a course enrollment or internship.");
  }
  if (!this.completionDate) {
    throw new Error("Certificate must record a completion date.");
  }
});

// One certificate per enrollment (prevents double-click/refresh/retry dupes).
CertificateSchema.index({ enrollment: 1 }, { unique: true, partialFilterExpression: { enrollment: { $type: "objectId" } } });
CertificateSchema.index({ internshipEnrollment: 1 }, { unique: true, partialFilterExpression: { internshipEnrollment: { $type: "objectId" } } });
// Fast lookups by owner / course / issued ordering.
CertificateSchema.index({ student: 1, issuedAt: -1 });
CertificateSchema.index({ student: 1, status: 1 });
CertificateSchema.index({ course: 1 });
CertificateSchema.index({ status: 1, issuedAt: -1 });
// Admin list filtering: search by certificate number is already served by the
// unique index above; these cover the status+temporal filters.
CertificateSchema.index({ issuedAt: -1 });
CertificateSchema.index({ certificateType: 1, status: 1 });

export const Certificate = defineModel("Certificate", CertificateSchema);
