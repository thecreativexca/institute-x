import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import {
  CERTIFICATE_STATUSES,
  CERTIFICATE_TYPES,
  ENROLLMENT_STATUSES,
  type CertificateType,
} from "@/lib/constants";
import { completeEnrollmentIfEligible } from "@/lib/progress/course";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Certificate } from "@/models/Certificate";
import { isOfficeRole } from "@/lib/auth/permissions";

import { CertificateError, CERTIFICATE_ERROR } from "./errors";
import {
  buildCertificateNumber,
  generateVerificationCode,
  nextCertificateSequenceStep,
} from "./ids";
import { getCertificateVerificationUrl } from "./verification-url";
import { generateCertificatePdf } from "./pdf";
import {
  buildCertificateFolder,
  buildCertificatePublicId,
  deleteCertificatePdf,
  uploadCertificatePdf,
} from "./cloudinary";
import { certificateToDetail } from "./translate";
import { sendCertificateIssuedEmail } from "./email";
import { notifyUser, safeNotify } from "@/lib/notifications/service";
import type { CertificateDetail, EligibleEnrollment } from "@/types/certificate";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as { code?: number | string }).code === 11000
  );
}

/**
 * Core issuance service (spec §10, §45, §77, §82).
 *
 * Idempotent: calling this repeatedly for the same enrollment always yields at
 * most one Certificate. Eligibility is re-evaluated server-side via the
 * Phase 11 completion engine — never from client-supplied flags.
 *
 * Consistency/compensation (§59): the PDF is uploaded to Cloudinary, then the
 * DB record is created. If the DB create fails the freshly-uploaded PDF is
 * deleted; if a concurrent request already created the certificate, the loser
 * cleans up its own PDF and returns the existing certificate.
 */
export async function issueCertificateForEnrollment(params: {
  enrollmentId: string;
  actorId: string;
  actorRole: string;
}): Promise<CertificateDetail> {
  await connectDB();

  let enrollmentObjectId: Types.ObjectId;
  try {
    enrollmentObjectId = new Types.ObjectId(params.enrollmentId);
  } catch {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  const enrollment = await Enrollment.findById(enrollmentObjectId)
    .select("_id student course status completedAt")
    .lean();

  if (!enrollment) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_FOUND, undefined, 404);
  }

  const isStaffActor = isOfficeRole(params.actorRole);
  const ownsEnrollment = enrollment.student.toString() === params.actorId;
  if (!isStaffActor && !ownsEnrollment) {
    throw new CertificateError(CERTIFICATE_ERROR.ACCESS_DENIED, undefined, 403);
  }

  if (enrollment.status !== ENROLLMENT_STATUSES.COMPLETED) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_ELIGIBLE, undefined, 409);
  }

  const studentId = enrollment.student.toString();
  const courseId = enrollment.course.toString();

  // Re-evaluate completion eligibility through the Phase 11 engine.
  const completion = await completeEnrollmentIfEligible(studentId, courseId);
  if (!completion.completed) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_ELIGIBLE, undefined, 409);
  }

  const completionDate = enrollment.completedAt ?? new Date();

  // Idempotency short-circuit: an existing certificate returns unchanged.
  const existing = await Certificate.findOne({ enrollment: enrollmentObjectId }).lean();
  if (existing) {
    return certificateToDetail(existing);
  }

  const [student, course] = await Promise.all([
    User.findById(studentId).select("name email").lean(),
    Course.findById(courseId).select("name").lean(),
  ]);
  if (!student || !course) {
    throw new CertificateError(CERTIFICATE_ERROR.NOT_ELIGIBLE, undefined, 409);
  }

  const certificateType: CertificateType = CERTIFICATE_TYPES.COURSE_COMPLETION;
  const now = new Date();
  const year = now.getFullYear();

  // Reserve the official number once (atomic counter).
  const seq = await nextCertificateSequenceStep(certificateType, year);
  const certificateNumber = buildCertificateNumber(seq, year, certificateType);
  const folder = buildCertificateFolder({ year, certificateNumber });
  const publicId = buildCertificatePublicId(certificateNumber);

  const studentObjectId = new Types.ObjectId(studentId);
  const courseObjectId = new Types.ObjectId(courseId);
  const studentEmail = student.email;
// Verification code is genuinely random; collision is astronomically
  // unlikely. A short retry loop covers a rare concurrent same-code hit
  // (regenerating the PDF each attempt keeps QR/text in sync).
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const verificationCode = generateVerificationCode();
    const verificationUrl = getCertificateVerificationUrl(verificationCode);

    const pdfBuffer = await generateCertificatePdf({
      studentName: student.name,
      courseName: course.name,
      completionDate,
      issuedAt: now,
      certificateNumber,
      verificationCode,
      verificationUrl,
    });

    const uploaded = await uploadCertificatePdf({
      buffer: pdfBuffer,
      folder,
      publicId,
    });

    try {
      const created = await Certificate.create({
        student: studentObjectId,
        course: courseObjectId,
        enrollment: enrollmentObjectId,
        certificateNumber,
        verificationCode,
        certificateType,
        studentNameSnapshot: student.name,
        courseNameSnapshot: course.name,
        issuedAt: now,
        completionDate,
        status: CERTIFICATE_STATUSES.ISSUED,
        pdfUrl: uploaded.fileUrl,
        pdfPublicId: uploaded.publicId,
        qrVerificationUrl: verificationUrl,
        issuedBy: isStaffActor ? `staff:${params.actorId}` : `student:${params.actorId}`,
        metadata: { issuerRole: params.actorRole },
      });

      // Email is best-effort and never blocks or breaks issuance (§43–§44).
      await sendCertificateIssuedEmail({
        studentId: studentId,
        studentName: student.name,
        studentEmail: studentEmail,
        courseId: courseId,
        courseName: course.name,
        certificateId: created._id.toString(),
        certificateNumber,
        issuedAt: now,
      }).catch((error: unknown) => {
        console.error(
          "Certificate email failed (certificate already issued):",
          error instanceof Error ? error.message : error
        );
      });

      await safeNotify(
        () =>
          notifyUser({
            recipientId: studentId,
            title: "Certificate issued",
            message: `Your certificate for ${course.name} is ready to download.`,
            type: "success",
            link: `/student/certificates/${created._id.toString()}`,
          }),
        "Certificate issue",
      );

      return certificateToDetail(created);
    } catch (error) {
      // Compensation: remove the freshly uploaded PDF on any failed create.
      const cleaned = await deleteCertificatePdf(uploaded.publicId);
      if (!cleaned) {
        console.error("Orphaned certificate PDF (cleanup failed):", uploaded.publicId);
      }

      if (isDuplicateKeyError(error)) {
        // Either a concurrent request issued for this enrollment (return it),
        // or a verification-code collision (retry with a fresh code).
        const raced = await Certificate.findOne({ enrollment: enrollmentObjectId }).lean();
        if (raced) return certificateToDetail(raced);
        continue;
      }
      throw new CertificateError(CERTIFICATE_ERROR.GENERATION_FAILED, undefined, 500);
    }
  }

  throw new CertificateError(CERTIFICATE_ERROR.GENERATION_FAILED, undefined, 500);
}
/**
 * Completed enrollments owned by the student that are certificate-ready but
 * not yet issued. Treats Enrollment.status === COMPLETED as authoritative
 * readiness — the completion engine only sets COMPLETED when eligible.
 */
export async function listCertificateEligibleEnrollments(
  studentId: string
): Promise<EligibleEnrollment[]> {
  await connectDB();

  const objectId = new Types.ObjectId(studentId);

  const existing = await Certificate.find({ student: objectId })
    .select("enrollment")
    .lean();
  const issuedEnrollmentIds = new Set(
    existing.flatMap((c) => c.enrollment ? [c.enrollment.toString()] : [])
  );

  const enrollments = await Enrollment.find({
    student: objectId,
    status: ENROLLMENT_STATUSES.COMPLETED,
  })
    .select("_id course completedAt")
    .lean();

  const courseIds = [
    ...new Set(
      enrollments
        .filter((e) => !issuedEnrollmentIds.has(e._id.toString()))
        .map((e) => e.course.toString())
    ),
  ];

  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("_id name").lean()
    : [];
  const courseNameById = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const result: EligibleEnrollment[] = [];
  for (const enrollment of enrollments) {
    if (issuedEnrollmentIds.has(enrollment._id.toString())) continue;
    const courseName = courseNameById.get(enrollment.course.toString());
    if (!courseName) continue;
    result.push({
      enrollmentId: enrollment._id.toString(),
      courseId: enrollment.course.toString(),
      courseName,
      completionDate: enrollment.completedAt?.toISOString() ?? new Date().toISOString(),
    });
  }
  return result;
}
