import "server-only";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";

import { recordAuditEvent } from "@/lib/audit/log";
import { CERTIFICATE_STATUSES, CERTIFICATE_TYPES } from "@/lib/constants";
import { connectDB } from "@/lib/db/connect";
import { notifyUser, safeNotify } from "@/lib/notifications/service";
import { Certificate } from "@/models/Certificate";
import { Course } from "@/models/Course";
import { User } from "@/models/User";

import { CERTIFICATE_ERROR, CertificateError } from "@/lib/certificates/errors";
import {
  generateVerificationCode,
  normalizeCertificateNumber,
} from "@/lib/certificates/ids";
import {
  buildCertificateFolder,
  buildCertificatePublicId,
  deleteCertificateFile,
  uploadCertificateFile,
} from "@/lib/certificates/cloudinary";
import { getCertificateVerificationUrl } from "@/lib/certificates/verification-url";
import { issueCertificateForEnrollment } from "@/lib/certificates/issue";
import type { CertificateDetail } from "@/types/certificate";

import { validateCertificateFile } from "./files";
import { certificateNumberExists, getOfficeCertificate } from "./queries";
import type { OfficeCertificateRow } from "./dto";
import type {
  CertificateUpdateInput,
  CertificateUploadInput,
} from "./validation";

/**
 * Admin certificate write operations.
 *
 * Every function here is only reachable through an ADMIN-guarded route handler
 * (`requireAdminApi`). The actor is always taken from the server session and
 * written to the audit log — never from the request body.
 *
 * Consistency model (mirrors `issueCertificateForEnrollment`): the file is
 * uploaded to Cloudinary first, then the DB record is written. If the DB write
 * fails the freshly uploaded file is deleted so no orphan is left behind.
 */

/** Label stored as `courseNameSnapshot` when no catalogue course is selected. */
const NO_COURSE_LABEL = "General";

/** Who performed the write; taken from the validated session by the route. */
export interface CertificateActor {
  id: string;
  role: string;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as { code?: number | string }).code === 11000
  );
}

function assertValidId(id: string): string {
  if (!Types.ObjectId.isValid(id)) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }
  return id;
}

/**
 * Refreshes every surface a certificate change can affect: the admin list, the
 * owning student's pages/dashboard, and the public verification page (which is
 * keyed by BOTH the verification code and the certificate number).
 */
function revalidateCertificateSurfaces(cert: {
  verificationCode: string;
  certificateNumber: string;
  studentId: string;
}): void {
  // The student detail route is keyed by certificate id, so revalidating the
  // `/student/certificates` segment layout clears it along with the list.
  revalidatePath("/office");
  revalidatePath("/office/certificates");
  revalidatePath("/office/certificates/revoked");
  revalidatePath("/student/certificates", "layout");
  revalidatePath("/student/dashboard");
  revalidatePath("/verify-certificate");
  revalidatePath(`/verify-certificate/${cert.verificationCode}`);
  revalidatePath(`/verify-certificate/${cert.certificateNumber}`);
}

/* -------------------------------------------------------------------------- */
/*  Create (admin upload)                                                      */
/* -------------------------------------------------------------------------- */

export interface CreateCertificateParams {
  input: CertificateUploadInput;
  /** Raw `FormData` value; validated (MIME/extension/magic bytes/size) here. */
  file: unknown;
  actor: CertificateActor;
}

/**
 * Creates an admin-uploaded certificate for a student.
 *
 * Order of operations deliberately puts every cheap validation (student exists,
 * number unique) before the expensive Cloudinary upload, so a rejected request
 * never leaves a stored file behind.
 */
export async function createCertificate(
  params: CreateCertificateParams
): Promise<OfficeCertificateRow> {
  await connectDB();

  const { input, actor } = params;

  const student = await User.findOne({
    _id: input.studentId,
    role: "student",
  })
    .select("name")
    .lean();

  if (!student) {
    throw new CertificateError(CERTIFICATE_ERROR.STUDENT_NOT_FOUND, undefined, 404);
  }
  const studentName = student.name;

  // Resolve the optional course and snapshot its name at upload time, so later
  // course renames never alter an already-issued document.
  let courseObjectId: Types.ObjectId | null = null;
  let courseName = NO_COURSE_LABEL;
  if (input.courseId) {
    const course = await Course.findById(input.courseId).select("name").lean();
    if (!course) {
      throw new CertificateError(CERTIFICATE_ERROR.COURSE_NOT_FOUND, undefined, 404);
    }
    courseObjectId = course._id;
    courseName = course.name;
  }

  const certificateNumber = normalizeCertificateNumber(input.certificateNumber);
  if (await certificateNumberExists(certificateNumber)) {
    throw new CertificateError(CERTIFICATE_ERROR.DUPLICATE_NUMBER, undefined, 409);
  }

  // Only now read + validate the file bytes.
  const file = await validateCertificateFile(params.file);

  const issuedAt = input.issueDate;
  const folder = buildCertificateFolder({
    year: issuedAt.getFullYear(),
    certificateNumber,
  });
  const publicId = buildCertificatePublicId(certificateNumber);

  const uploaded = await uploadCertificateFile({
    buffer: file.buffer,
    folder,
    publicId,
    mimeType: file.mimeType,
  }).catch((error: unknown) => {
    console.error(
      "Certificate upload failed:",
      error instanceof Error ? error.message : error
    );
    throw new CertificateError(CERTIFICATE_ERROR.STORAGE_FAILED, undefined, 502);
  });

  const verificationCode = generateVerificationCode();

  try {
    const created = await Certificate.create({
      student: new Types.ObjectId(input.studentId),
      course: courseObjectId,
      certificateNumber,
      verificationCode,
      certificateType: CERTIFICATE_TYPES.MANUAL_UPLOAD,
      studentNameSnapshot: studentName,
      courseNameSnapshot: courseName,
      issuedAt,
      // Admin uploads may omit it; the schema hook would default it anyway.
      completionDate: input.completionDate ?? issuedAt,
      status: CERTIFICATE_STATUSES.ISSUED,
      pdfUrl: uploaded.fileUrl,
      pdfPublicId: uploaded.publicId,
      qrVerificationUrl: getCertificateVerificationUrl(verificationCode),
      certificateTitle: input.certificateTitle,
      grade: input.grade ?? null,
      notes: input.notes ?? null,
      fileType: file.mimeType,
      fileSize: uploaded.fileSize,
      originalFileName: file.originalFileName,
      fileResourceType: uploaded.resourceType,
      uploadedBy: new Types.ObjectId(actor.id),
      issuedBy: `admin:${actor.id}`,
      metadata: { issuerRole: actor.role, source: "admin_upload" },
    });

    await recordAuditEvent({
      actorUserId: actor.id,
      actorRole: actor.role,
      action: "certificate.upload",
      entityType: "certificate",
      entityId: created._id.toString(),
      metadata: {
        certificateNumber,
        studentId: input.studentId,
        courseId: input.courseId ?? null,
        fileType: file.mimeType,
      },
    });

    await safeNotify(
      () =>
        notifyUser({
          recipientId: input.studentId,
          title: "Certificate issued",
          message: `Your certificate ${certificateNumber} is now available to download.`,
          type: "success",
          link: `/student/certificates/${created._id.toString()}`,
        }),
      "Certificate upload"
    );

    const row = await getOfficeCertificate(created._id.toString());
    if (!row) {
      throw new CertificateError(CERTIFICATE_ERROR.INTERNAL, undefined, 500);
    }

    revalidateCertificateSurfaces({
      verificationCode: created.verificationCode,
      certificateNumber: created.certificateNumber,
      studentId: input.studentId,
    });

    return row;
  } catch (error) {
    // Compensation: never leave an uploaded file without a DB record.
    const cleaned = await deleteCertificateFile(
      uploaded.publicId,
      uploaded.resourceType
    );
    if (!cleaned) {
      console.error("Orphaned certificate file (cleanup failed):", uploaded.publicId);
    }

    if (isDuplicateKeyError(error)) {
      // The unique index can only realistically have fired on the certificate
      // number (the pre-check above raced). A verification-code collision is
      // astronomically unlikely, and this is still the useful message.
      throw new CertificateError(CERTIFICATE_ERROR.DUPLICATE_NUMBER, undefined, 409);
    }
    if (error instanceof CertificateError) throw error;
    console.error(
      "Certificate create failed:",
      error instanceof Error ? error.message : error
    );
    throw new CertificateError(CERTIFICATE_ERROR.INTERNAL, undefined, 500);
  }
}

/* -------------------------------------------------------------------------- */
/*  Update metadata                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Updates descriptive metadata only. The stored file is untouched — that is
 * what `replaceCertificateFile` is for.
 */
export async function updateCertificate(params: {
  certificateId: string;
  input: CertificateUpdateInput;
  actor: CertificateActor;
}): Promise<OfficeCertificateRow> {
  await connectDB();
  const certificateId = assertValidId(params.certificateId);
  const { input, actor } = params;

  const existing = await Certificate.findById(certificateId).select("+notes").lean();
  if (!existing) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  const update: Record<string, unknown> = {};

  if (input.certificateTitle !== undefined) {
    update.certificateTitle = input.certificateTitle;
  }
  if (input.issueDate !== undefined) update.issuedAt = input.issueDate;
  if (input.completionDate !== undefined) {
    update.completionDate = input.completionDate;
  }
  if (input.grade !== undefined) update.grade = input.grade ?? null;
  if (input.notes !== undefined) update.notes = input.notes ?? null;

  if (input.certificateNumber !== undefined) {
    const next = normalizeCertificateNumber(input.certificateNumber);
    if (
      next !== existing.certificateNumber &&
      (await certificateNumberExists(next, certificateId))
    ) {
      throw new CertificateError(CERTIFICATE_ERROR.DUPLICATE_NUMBER, undefined, 409);
    }
    update.certificateNumber = next;
  }

  // `courseId: null` explicitly detaches the course (keeps the old snapshot as
  // the display label); a value re-attaches and re-snapshots the course name.
  if (input.courseId !== undefined) {
    if (input.courseId === null) {
      update.course = null;
    } else {
      const course = await Course.findById(input.courseId).select("name").lean();
      if (!course) {
        throw new CertificateError(CERTIFICATE_ERROR.COURSE_NOT_FOUND, undefined, 404);
      }
      update.course = course._id;
      update.courseNameSnapshot = course.name;
    }
  } else if (input.courseName !== undefined) {
    update.courseNameSnapshot = input.courseName;
  }

  try {
    const updated = await Certificate.findByIdAndUpdate(
      certificateId,
      { $set: update },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
    }
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new CertificateError(CERTIFICATE_ERROR.DUPLICATE_NUMBER, undefined, 409);
    }
    throw error;
  }

  await recordAuditEvent({
    actorUserId: actor.id,
    actorRole: actor.role,
    action: "certificate.update",
    entityType: "certificate",
    entityId: certificateId,
    metadata: { fields: Object.keys(update) },
  });

  const row = await getOfficeCertificate(certificateId);
  if (!row) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  revalidateCertificateSurfaces({
    verificationCode: row.verificationCode,
    certificateNumber: row.certificateNumber,
    studentId: row.studentId,
  });

  return row;
}

/* -------------------------------------------------------------------------- */
/*  Replace the stored file                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Swaps the certificate file while keeping the SAME database record, the same
 * certificate number and the whole status history. The previous Cloudinary
 * asset is deleted only after the new one is safely persisted, so a failed
 * replace never leaves the certificate without a file.
 */
export async function replaceCertificateFile(params: {
  certificateId: string;
  file: unknown;
  actor: CertificateActor;
}): Promise<OfficeCertificateRow> {
  await connectDB();
  const certificateId = assertValidId(params.certificateId);

  const existing = await Certificate.findById(certificateId)
    .select(
      "+notes pdfUrl pdfPublicId fileResourceType certificateNumber verificationCode student issuedAt"
    )
    .lean();
  if (!existing) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  const file = await validateCertificateFile(params.file);

  // A distinct public_id per revision: uploading with `overwrite: false` onto
  // an existing id would be rejected by Cloudinary, and versioning also keeps
  // the old asset addressable until it is deleted below.
  const revision = Date.now().toString(36);
  const folder = buildCertificateFolder({
    year: existing.issuedAt.getFullYear(),
    certificateNumber: existing.certificateNumber,
  });
  const publicId = `${buildCertificatePublicId(existing.certificateNumber)}-${revision}`;

  const uploaded = await uploadCertificateFile({
    buffer: file.buffer,
    folder,
    publicId,
    mimeType: file.mimeType,
  }).catch((error: unknown) => {
    console.error(
      "Certificate replace upload failed:",
      error instanceof Error ? error.message : error
    );
    throw new CertificateError(CERTIFICATE_ERROR.STORAGE_FAILED, undefined, 502);
  });

  try {
    await Certificate.findByIdAndUpdate(certificateId, {
      $set: {
        pdfUrl: uploaded.fileUrl,
        pdfPublicId: uploaded.publicId,
        fileType: file.mimeType,
        fileSize: uploaded.fileSize,
        originalFileName: file.originalFileName,
        fileResourceType: uploaded.resourceType,
        replacedAt: new Date(),
      },
    });
  } catch (error) {
    await deleteCertificateFile(uploaded.publicId, uploaded.resourceType);
    console.error(
      "Certificate replace DB write failed:",
      error instanceof Error ? error.message : error
    );
    throw new CertificateError(CERTIFICATE_ERROR.INTERNAL, undefined, 500);
  }

  // The new file is committed; removing the old one is now safe. A failure
  // here only leaves an unreferenced asset, never a broken certificate.
  const previousPublicId = existing.pdfPublicId;
  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    const previousResourceType =
      existing.fileResourceType === "image" ? "image" : "raw";
    const deleted = await deleteCertificateFile(
      previousPublicId,
      previousResourceType
    );
    if (!deleted) {
      console.error(
        "Previous certificate file could not be deleted:",
        previousPublicId
      );
    }
  }

  await recordAuditEvent({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: "certificate.replace",
    entityType: "certificate",
    entityId: certificateId,
    metadata: {
      certificateNumber: existing.certificateNumber,
      fileType: file.mimeType,
      previousPublicId,
    },
  });

  await safeNotify(
    () =>
      notifyUser({
        recipientId: existing.student.toString(),
        title: "Certificate updated",
        message: `The file for certificate ${existing.certificateNumber} has been updated. Please download the latest copy.`,
        type: "info",
        link: `/student/certificates/${certificateId}`,
      }),
    "Certificate replace"
  );

  const row = await getOfficeCertificate(certificateId);
  if (!row) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  revalidateCertificateSurfaces({
    verificationCode: row.verificationCode,
    certificateNumber: row.certificateNumber,
    studentId: row.studentId,
  });

  return row;
}

/* -------------------------------------------------------------------------- */
/*  Revoke / reactivate                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Revokes an issued certificate. The record and file are NEVER deleted — the
 * status change is what invalidates it, so verification can still report
 * "Certificate Revoked" instead of a confusing "not found".
 */
export async function revokeCertificate(params: {
  certificateId: string;
  reason: string;
  actor: CertificateActor;
}): Promise<OfficeCertificateRow> {
  await connectDB();
  const certificateId = assertValidId(params.certificateId);

  const updated = await Certificate.findOneAndUpdate(
    { _id: certificateId, status: CERTIFICATE_STATUSES.ISSUED },
    {
      $set: {
        status: CERTIFICATE_STATUSES.REVOKED,
        revokedAt: new Date(),
        revokedBy: `admin:${params.actor.id}`,
        revocationReason: params.reason,
        // A later reactivation clears this; it exists to tell a restored
        // certificate apart from one that was never revoked.
        restoredAt: null,
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    // Distinguish "no such certificate" from "already revoked".
    const exists = await Certificate.findById(certificateId).select("_id").lean();
    throw new CertificateError(
      exists ? CERTIFICATE_ERROR.INVALID_STATE : CERTIFICATE_ERROR.NOT_FOUND,
      undefined,
      exists ? 409 : 404
    );
  }

  await recordAuditEvent({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: "certificate.revoke",
    entityType: "certificate",
    entityId: certificateId,
    metadata: {
      certificateNumber: updated.certificateNumber,
      reason: params.reason,
    },
  });

  await safeNotify(
    () =>
      notifyUser({
        recipientId: updated.student,
        title: "Certificate revoked",
        message: `Certificate ${updated.certificateNumber} has been revoked. Reason: ${params.reason}`,
        type: "warning",
        link: `/student/certificates/${certificateId}`,
      }),
    "Certificate revoke"
  );

  const row = await getOfficeCertificate(certificateId);
  if (!row) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  revalidateCertificateSurfaces({
    verificationCode: row.verificationCode,
    certificateNumber: row.certificateNumber,
    studentId: row.studentId,
  });

  return row;
}

/** Restores a revoked certificate to issued. The file is left untouched. */
export async function reactivateCertificate(params: {
  certificateId: string;
  actor: CertificateActor;
}): Promise<OfficeCertificateRow> {
  await connectDB();
  const certificateId = assertValidId(params.certificateId);

  const updated = await Certificate.findOneAndUpdate(
    { _id: certificateId, status: CERTIFICATE_STATUSES.REVOKED },
    {
      $set: {
        status: CERTIFICATE_STATUSES.ISSUED,
        // Keep `revocationReason` in the record as history; the restored flag
        // and the status are what the UI and verification actually read.
        restoredAt: new Date(),
      },
    },
    { new: true }
  ).lean();

  if (!updated) {
    const exists = await Certificate.findById(certificateId).select("_id").lean();
    throw new CertificateError(
      exists ? CERTIFICATE_ERROR.INVALID_STATE : CERTIFICATE_ERROR.NOT_FOUND,
      undefined,
      exists ? 409 : 404
    );
  }

  await recordAuditEvent({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: "certificate.restore",
    entityType: "certificate",
    entityId: certificateId,
    metadata: { certificateNumber: updated.certificateNumber },
  });

  await safeNotify(
    () =>
      notifyUser({
        recipientId: updated.student,
        title: "Certificate restored",
        message: `Certificate ${updated.certificateNumber} is valid again and can be downloaded.`,
        type: "success",
        link: `/student/certificates/${certificateId}`,
      }),
    "Certificate restore"
  );

  const row = await getOfficeCertificate(certificateId);
  if (!row) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  revalidateCertificateSurfaces({
    verificationCode: row.verificationCode,
    certificateNumber: row.certificateNumber,
    studentId: row.studentId,
  });

  return row;
}

/* -------------------------------------------------------------------------- */
/*  Delete                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Permanently removes a certificate and its stored file.
 *
 * Destructive and irreversible — the admin UI must confirm before calling it.
 * A failed Cloudinary delete still removes the DB row: an unreferenced asset is
 * preferable to a row pointing at a file the admin believes is gone. The
 * failure is logged and audited.
 */
export async function deleteCertificate(params: {
  certificateId: string;
  actor: CertificateActor;
}): Promise<{ certificateNumber: string }> {
  await connectDB();
  const certificateId = assertValidId(params.certificateId);

  const existing = await Certificate.findById(certificateId)
    .select("certificateNumber pdfPublicId fileResourceType verificationCode student")
    .lean();
  if (!existing) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  if (existing.pdfPublicId) {
    const resourceType =
      existing.fileResourceType === "image" ? "image" : "raw";
    const deleted = await deleteCertificateFile(existing.pdfPublicId, resourceType);
    if (!deleted) {
      console.error(
        "Certificate file could not be deleted (removing DB record anyway):",
        existing.pdfPublicId
      );
    }
  }

  await Certificate.findByIdAndDelete(certificateId);

  await recordAuditEvent({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: "certificate.delete",
    entityType: "certificate",
    entityId: certificateId,
    metadata: {
      certificateNumber: existing.certificateNumber,
      studentId: existing.student?.toString() ?? null,
    },
  });

  revalidateCertificateSurfaces({
    verificationCode: existing.verificationCode,
    certificateNumber: existing.certificateNumber,
    studentId: existing.student?.toString() ?? "",
  });

  return { certificateNumber: existing.certificateNumber };
}

/* -------------------------------------------------------------------------- */
/*  Admin-triggered generated issuance                                         */
/* -------------------------------------------------------------------------- */

/**
 * Server-generated certificate for a completed enrollment, triggered by an
 * admin.
 *
 * This is the ONLY remaining caller of `issueCertificateForEnrollment`:
 * students can no longer generate certificates for themselves (they may only
 * view, download and verify). The actor id/role still come from the validated
 * admin session, never from the request.
 */
export async function issueGeneratedCertificate(params: {
  enrollmentId: string;
  actor: CertificateActor;
}): Promise<CertificateDetail> {
  const detail = await issueCertificateForEnrollment({
    enrollmentId: params.enrollmentId,
    actorId: params.actor.id,
    actorRole: params.actor.role,
  });

  await recordAuditEvent({
    actorUserId: params.actor.id,
    actorRole: params.actor.role,
    action: "certificate.upload",
    entityType: "certificate",
    entityId: detail.id,
    metadata: {
      source: "generated",
      certificateNumber: detail.certificateNumber,
      enrollmentId: params.enrollmentId,
    },
  });

  revalidatePath("/office/certificates");
  revalidatePath("/student/certificates");
  revalidatePath("/student/dashboard");
  revalidatePath(`/verify-certificate/${detail.verificationCode}`);

  return detail;
}
