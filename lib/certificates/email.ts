import { sendCertificateIssuedEmail as sendCertificateEmail } from "@/lib/email";
import { siteConfig } from "@/lib/config/site";
import { env } from "@/lib/config/env";

/**
 * Best-effort certificate-issued email (spec §43–§44).
 *
 * Deliberately small and reusable. The certificate issuance MUST NOT fail when
 * email delivery fails — callers invoke this with `.catch()` and only log.
 * The email links to the Student Portal, not a huge PDF attachment.
 */
export interface CertificateEmailInput {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  certificateId: string;
  certificateNumber: string;
  issuedAt: Date;
}

export async function sendCertificateIssuedEmail(
  input: CertificateEmailInput
): Promise<void> {
  await sendCertificateEmail({
    studentId: input.studentId,
    studentName: input.studentName,
    studentEmail: input.studentEmail,
    courseId: input.courseId,
    courseName: input.courseName,
    certificateId: input.certificateId,
    certificateNumber: input.certificateNumber,
    issuedAt: input.issuedAt,
  });
}