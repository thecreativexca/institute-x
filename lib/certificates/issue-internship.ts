import "server-only";
import { connectDB } from "@/lib/db/connect";
import { Certificate } from "@/models/Certificate";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { Internship } from "@/models/Internship";
import { User } from "@/models/User";
import {
  calculateInternshipProgress,
  completionBlockedReason,
  objectId,
  serialize,
} from "@/lib/internships/service";
import {
  buildCertificateFolder,
  buildCertificatePublicId,
  deleteCertificatePdf,
  uploadCertificatePdf,
} from "./cloudinary";
import {
  buildCertificateNumber,
  generateVerificationCode,
  nextCertificateSequenceStep,
} from "./ids";
import { generateCertificatePdf } from "./pdf";
import { getCertificateVerificationUrl } from "./verification-url";
import { notifyUser } from "@/lib/notifications/service";

export async function issueInternshipCertificate(
  enrollmentId: string,
  adminId: string,
  override = false,
) {
  await connectDB();
  const enrollment = await InternshipEnrollment.findById(
    objectId(enrollmentId),
  );
  if (!enrollment) throw new Error("Internship enrollment not found.");
  const existing = await Certificate.findOne({
    internshipEnrollment: enrollment._id,
  });
  if (existing) return serialize(existing.toObject());
  const [internship, student] = await Promise.all([
    Internship.findById(enrollment.internship),
    User.findById(enrollment.student),
  ]);
  if (!internship || !student)
    throw new Error("Internship or student not found.");
  const progress = await calculateInternshipProgress(
    internship._id.toString(),
    student._id.toString(),
  );
  const blocked = completionBlockedReason(
    internship.completionRules,
    progress,
    enrollment.finalScore,
  );
  if (!override) {
    if (enrollment.status !== "completed") {
      throw new Error("Complete the internship before issuing a certificate.");
    }
    if (blocked) throw new Error(blocked);
  }
  const issuedAt = new Date(),
    year = issuedAt.getFullYear(),
    number = buildCertificateNumber(
      await nextCertificateSequenceStep("internship", year),
      year,
      "internship",
    ),
    code = generateVerificationCode(),
    url = getCertificateVerificationUrl(code);
  const buffer = await generateCertificatePdf({
    studentName: student.name,
    courseName: internship.title,
    completionDate: enrollment.completedAt ?? issuedAt,
    issuedAt,
    certificateNumber: number,
    verificationCode: code,
    verificationUrl: url,
  });
  const uploaded = await uploadCertificatePdf({
    buffer,
    folder: buildCertificateFolder({ year, certificateNumber: number }),
    publicId: buildCertificatePublicId(number),
  });
  try {
    const cert = await Certificate.create({
      student: student._id,
      course: null,
      enrollment: null,
      internshipEnrollment: enrollment._id,
      certificateNumber: number,
      verificationCode: code,
      certificateType: "internship",
      studentNameSnapshot: student.name,
      courseNameSnapshot: internship.title,
      issuedAt,
      completionDate: enrollment.completedAt ?? issuedAt,
      status: "issued",
      pdfUrl: uploaded.fileUrl,
      pdfPublicId: uploaded.publicId,
      qrVerificationUrl: url,
      issuedBy: adminId,
      metadata: {
        internshipId: internship._id.toString(),
        durationValue: internship.durationValue,
        durationUnit: internship.durationUnit,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
        grade: enrollment.grade,
      },
    });
    enrollment.certificate = cert._id;
    await enrollment.save();
    await notifyUser({
      recipientId: student._id,
      title: "Internship certificate issued",
      message: `Your certificate for ${internship.title} is ready.`,
      type: "success",
      link: `/student/certificates/${cert._id}`,
    });
    return serialize(cert.toObject());
  } catch (e) {
    await deleteCertificatePdf(uploaded.publicId);
    throw e;
  }
}
