import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { Certificate } from "@/models/Certificate";
import { certificateToDetail, certificateToListItem } from "./translate";
import { CertificateError, CERTIFICATE_ERROR } from "./errors";
import type { CertificateDetail, CertificateListItem } from "@/types/certificate";

/**
 * Student-scoped certificate reads. Every query filters by the authenticated
 * student id first (spec §47–§48) — swapping a certificateId never exposes
 * another student's certificate.
 */

/** ObjectId or null; never throws on a malformed id. */
function toObjectIdOrNull(id: string): Types.ObjectId | null {
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
}

/** All of the current student's certificates, newest first. */
export async function listStudentCertificates(
  studentId: string
): Promise<CertificateListItem[]> {
  await connectDB();
  const certs = await Certificate.find({
    student: new Types.ObjectId(studentId),
  })
    .sort({ issuedAt: -1 })
    .lean();
  return certs.map((c) => certificateToListItem(c));
}

/** One certificate owned by the current student, or null (ownership enforced). */
export async function getStudentCertificate(
  studentId: string,
  certificateId: string
): Promise<CertificateDetail | null> {
  let certificateObjectId: Types.ObjectId;
  try {
    certificateObjectId = new Types.ObjectId(certificateId);
  } catch {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  await connectDB();
  const cert = await Certificate.findOne({
    _id: certificateObjectId,
    student: new Types.ObjectId(studentId),
  }).lean();

  if (!cert) return null;
  return certificateToDetail(cert);
}

/**
 * Storage reference for the student file routes (view / download).
 *
 * Filtered by the authenticated student id, exactly like `getStudentCertificate`
 * — a student can never obtain the delivery URL of another student's file, and
 * the URL is only ever used server-side to proxy the bytes back.
 */
export async function getStudentCertificateFileRef(
  studentId: string,
  certificateId: string
): Promise<{
  pdfUrl: string;
  fileType: string | null;
  certificateNumber: string;
  status: string;
} | null> {
  const certificateObjectId = toObjectIdOrNull(certificateId);
  const studentObjectId = toObjectIdOrNull(studentId);
  if (!certificateObjectId || !studentObjectId) return null;

  await connectDB();
  const cert = await Certificate.findOne({
    _id: certificateObjectId,
    student: studentObjectId,
  })
    .select("pdfUrl fileType certificateNumber status")
    .lean();

  if (!cert) return null;
  return {
    pdfUrl: cert.pdfUrl,
    fileType: cert.fileType ?? "application/pdf",
    certificateNumber: cert.certificateNumber,
    status: cert.status,
  };
}

/** Certificate for a given enrollment (used by the course detail page). */
export async function getCertificateByEnrollment(
  enrollmentId: string
): Promise<CertificateListItem | null> {
  let enrollmentObjectId: Types.ObjectId;
  try {
    enrollmentObjectId = new Types.ObjectId(enrollmentId);
  } catch {
    return null;
  }

  await connectDB();
  const cert = await Certificate.findOne({ enrollment: enrollmentObjectId }).lean();
  return cert ? certificateToListItem(cert) : null;
}

/**
 * Existence + snapshot lookup used by integration surfaces (My Courses,
 * dashboard) so they never fabricate certificate counts.
 */
export async function getCertificatesForCourseIds(
  studentId: string,
  courseIds: string[]
): Promise<Set<string>> {
  if (courseIds.length === 0) return new Set<string>();
  await connectDB();
  const objectIds = courseIds.map((id) => new Types.ObjectId(id));
  const certs = await Certificate.find({
    student: new Types.ObjectId(studentId),
    course: { $in: objectIds },
  })
    .select("course status")
    .lean();
  return new Set(certs.filter((c) => c.status === "issued" && c.course).map((c) => c.course!.toString()));
}
