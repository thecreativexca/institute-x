import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
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
 * Certificate — issued when an eligible student completes a course (Phase 12).
 *
 * Design principles:
 *   - One certificate per enrollment (unique `enrollment` index).
 *   - Snapshot fields (`studentNameSnapshot`, `courseNameSnapshot`,
 *     `completionDate`) are written at issuance so later course/title/profile
 *     edits never change an already-issued historical document.
 *   - `certificateNumber` (human-readable, sequential via atomic counter) and
 *     `verificationCode` (high-entropy, non-sequential, used in public URLs)
 *     are kept separate and both uniquely indexed.
 *   - The issued PDF is immutable: `pdfUrl` / `pdfPublicId` are stored once and
 *     never silently regenerated on every page visit.
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
  pdfUrl: string;
  pdfPublicId: string;
  qrVerificationUrl: string;
  /** Free text record of the authorizing role/id at issuance. */
  issuedBy?: string;
  metadata?: Record<string, unknown>;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  revocationReason?: string | null;
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
    },
    studentNameSnapshot: { type: String, required: true, trim: true },
    courseNameSnapshot: { type: String, required: true, trim: true },
    issuedAt: { type: Date, default: () => new Date() },
    completionDate: { type: Date, required: true },
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
  },
  { timestamps: true }
);

// Mongoose 9 middleware is promise-based: there is no `next` callback, so
// errors are reported by throwing inside the async hook.
CertificateSchema.pre("validate", async function () {
  if (!this.enrollment && !this.internshipEnrollment) {
    throw new Error("Certificate must belong to a course enrollment or internship.");
  }
});

// One certificate per enrollment (prevents double-click/refresh/retry dupes).
CertificateSchema.index({ enrollment: 1 }, { unique: true, partialFilterExpression: { enrollment: { $type: "objectId" } } });
CertificateSchema.index({ internshipEnrollment: 1 }, { unique: true, partialFilterExpression: { internshipEnrollment: { $type: "objectId" } } });
// Fast lookups by owner / course / issued ordering.
CertificateSchema.index({ student: 1, issuedAt: -1 });
CertificateSchema.index({ course: 1 });
CertificateSchema.index({ status: 1, issuedAt: -1 });

export const Certificate = defineModel("Certificate", CertificateSchema);
