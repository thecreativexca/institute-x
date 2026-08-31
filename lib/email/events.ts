import { siteConfig } from "@/lib/config/site";
import { formatCurrency } from "@/lib/payments/razorpay";
import {
  sendTransactionalEmail,
  EMAIL_EVENTS,
} from "./send-email";
import {
  generateEnrollmentConfirmationKey,
  generatePaymentConfirmationKey,
  generateAssignmentSubmissionKey,
  generateCourseCompletedKey,
  generateCertificateIssuedKey,
  generateVerificationKey,
  generateWelcomeKey,
  generatePasswordResetKey,
} from "./logging";

export interface VerificationEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  verificationUrl: string;
  expiryHours: number;
}

export async function sendVerificationEmail(params: VerificationEmailParams): Promise<void> {
  const { html, text } = (await import("./templates/verification")).renderVerificationEmail({
    studentName: params.studentName,
    verificationUrl: params.verificationUrl,
    expiryHours: params.expiryHours,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.EMAIL_VERIFICATION,
    template: "verification",
    to: params.studentEmail,
    subject: `Verify your email - ${siteConfig.name}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateVerificationKey(params.studentId),
    metadata: {
      studentName: params.studentName,
      verificationUrl: params.verificationUrl,
      expiryHours: params.expiryHours,
    },
  });
}

export interface PasswordResetEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  resetUrl: string;
  expiryMinutes: number;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const { html, text } = (await import("./templates/passwordReset")).renderPasswordResetEmail({
    studentName: params.studentName,
    resetUrl: params.resetUrl,
    expiryMinutes: params.expiryMinutes,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.PASSWORD_RESET,
    template: "password_reset",
    to: params.studentEmail,
    subject: `Reset your password - ${siteConfig.name}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generatePasswordResetKey(params.studentId),
    metadata: {
      studentName: params.studentName,
      resetUrl: params.resetUrl,
      expiryMinutes: params.expiryMinutes,
    },
  });
}

export interface WelcomeEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const dashboardUrl = `${siteConfig.url}/student/dashboard`;
  const coursesUrl = `${siteConfig.url}/courses`;

  const { html, text } = (await import("./templates/welcome")).renderWelcomeEmail({
    studentName: params.studentName,
    dashboardUrl,
    coursesUrl,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.WELCOME,
    template: "welcome",
    to: params.studentEmail,
    subject: `Welcome to ${siteConfig.name}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateWelcomeKey(params.studentId),
    metadata: {
      studentName: params.studentName,
      dashboardUrl,
      coursesUrl,
    },
  });
}

export interface EnrollmentConfirmedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  enrollmentId: string;
  enrollmentDate: Date;
  amount?: number;
  currency?: string;
}

export async function sendEnrollmentConfirmedEmail(params: EnrollmentConfirmedEmailParams): Promise<void> {
  const courseUrl = `${siteConfig.url}/student/courses/${params.courseId}`;
  const dashboardUrl = `${siteConfig.url}/student/dashboard`;
  const enrollmentDate = params.enrollmentDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { html, text } = (await import("./templates/enrollmentConfirmed")).renderEnrollmentConfirmedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    enrollmentDate,
    courseUrl,
    dashboardUrl,
    amount: params.amount ? formatCurrency(params.amount / 100, params.currency || "INR") : undefined,
    currency: params.currency,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ENROLLMENT_CONFIRMED,
    template: "enrollment_confirmed",
    to: params.studentEmail,
    subject: `Enrollment Confirmed — ${params.courseName}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateEnrollmentConfirmationKey(params.enrollmentId),
    relatedEntityType: "enrollment",
    relatedEntityId: params.enrollmentId,
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      enrollmentDate,
      courseUrl,
      dashboardUrl,
      amount: params.amount ? (params.amount / 100).toString() : undefined,
      currency: params.currency,
    },
  });
}

export interface PaymentConfirmedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  paymentId: string;
  amount: number;
  currency: string;
  receiptNumber: string;
  paidAt: Date;
}

export async function sendPaymentConfirmedEmail(params: PaymentConfirmedEmailParams): Promise<void> {
  const courseUrl = `${siteConfig.url}/student/courses/${params.courseId}`;
  const dashboardUrl = `${siteConfig.url}/student/dashboard`;
  const paymentDate = params.paidAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { html, text } = (await import("./templates/paymentConfirmed")).renderPaymentConfirmedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    amount: formatCurrency(params.amount / 100, params.currency),
    currency: params.currency,
    paymentDate,
    receiptNumber: params.receiptNumber,
    paymentId: params.paymentId,
    courseUrl,
    dashboardUrl,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.PAYMENT_CONFIRMED,
    template: "payment_confirmed",
    to: params.studentEmail,
    subject: `Payment Successful — ${params.courseName}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generatePaymentConfirmationKey(params.paymentId),
    relatedEntityType: "payment",
    relatedEntityId: params.paymentId,
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      amount: (params.amount / 100).toString(),
      currency: params.currency,
      paymentDate,
      receiptNumber: params.receiptNumber,
      paymentId: params.paymentId,
      courseUrl,
      dashboardUrl,
    },
  });
}

export interface AssignmentSubmittedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  submissionNumber: number;
  submittedAt: Date;
}

export async function sendAssignmentSubmittedEmail(params: AssignmentSubmittedEmailParams): Promise<void> {
  const submissionUrl = `${siteConfig.url}/student/assignments/${params.assignmentId}/submission/${params.submissionId}`;
  const submissionTime = params.submittedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const { html, text } = (await import("./templates/assignmentSubmitted")).renderAssignmentSubmittedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    assignmentTitle: params.assignmentTitle,
    submissionNumber: params.submissionNumber,
    submissionTime,
    submissionUrl,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ASSIGNMENT_SUBMITTED,
    template: "assignment_submitted",
    to: params.studentEmail,
    subject: `Assignment Submitted — ${params.assignmentTitle}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateAssignmentSubmissionKey(params.submissionId),
    relatedEntityType: "submission",
    relatedEntityId: params.submissionId,
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      assignmentTitle: params.assignmentTitle,
      submissionNumber: params.submissionNumber,
      submissionTime,
      submissionUrl,
    },
  });
}

export interface CourseCompletedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  enrollmentId: string;
  completedAt: Date;
  certificateStatus: string;
}

export async function sendCourseCompletedEmail(params: CourseCompletedEmailParams): Promise<void> {
  const progressUrl = `${siteConfig.url}/student/courses/${params.courseId}`;
  const completionDate = params.completedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { html, text } = (await import("./templates/courseCompleted")).renderCourseCompletedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    completionDate,
    progressUrl,
    certificateStatus: params.certificateStatus,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.COURSE_COMPLETED,
    template: "course_completed",
    to: params.studentEmail,
    subject: `Congratulations — ${params.courseName} Completed!`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateCourseCompletedKey(params.enrollmentId),
    relatedEntityType: "enrollment",
    relatedEntityId: params.enrollmentId,
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      completionDate,
      progressUrl,
      certificateStatus: params.certificateStatus,
    },
  });
}

export interface CertificateIssuedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  certificateId: string;
  certificateNumber: string;
  issuedAt: Date;
}

export async function sendCertificateIssuedEmail(params: CertificateIssuedEmailParams): Promise<void> {
  const certificateUrl = `${siteConfig.url}/student/certificates/${params.certificateId}`;
  const verificationUrl = `${siteConfig.url}/verify-certificate/${params.certificateNumber}`;
  const issuedDate = params.issuedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { html, text } = (await import("./templates/certificateIssued")).renderCertificateIssuedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    certificateNumber: params.certificateNumber,
    issuedDate,
    certificateUrl,
    verificationUrl,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.CERTIFICATE_ISSUED,
    template: "certificate_issued",
    to: params.studentEmail,
    subject: `Your Certificate Is Ready — ${params.courseName}`,
    html,
    text,
    recipientUserId: params.studentId,
    idempotencyKey: generateCertificateIssuedKey(params.certificateId),
    relatedEntityType: "certificate",
    relatedEntityId: params.certificateId,
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      certificateNumber: params.certificateNumber,
      issuedDate,
      certificateUrl,
      verificationUrl,
    },
  });
}

export interface AnnouncementEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  announcementId: string;
  announcementTitle: string;
  announcementBody: string;
  publishedAt: Date;
}

export async function sendAnnouncementEmail(params: AnnouncementEmailParams): Promise<void> {
  const announcementUrl = `${siteConfig.url}/student/announcements/${params.announcementId}`;
  const publishedAt = params.publishedAt.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { html, text } = (await import("./templates/announcement")).renderAnnouncementEmail({
    studentName: params.studentName,
    announcementTitle: params.announcementTitle,
    announcementBody: params.announcementBody,
    publishedAt,
    announcementUrl,
  });

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ANNOUNCEMENT,
    template: "announcement",
    to: params.studentEmail,
    subject: params.announcementTitle,
    html,
    text,
    recipientUserId: params.studentId,
    relatedEntityType: "announcement",
    relatedEntityId: params.announcementId,
    metadata: {
      studentName: params.studentName,
      announcementTitle: params.announcementTitle,
      announcementBody: params.announcementBody,
      publishedAt,
      announcementUrl,
    },
  });
}

export interface SupportCreatedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
}

export async function sendSupportCreatedEmail(params: SupportCreatedEmailParams): Promise<void> {
  const { html, text } = (await import("./templates/supportCreated")).renderSupportCreatedEmail({
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    ticketNumber: params.ticketNumber,
    subject: params.subject,
  });

  const { generateSupportCreatedKey } = await import("./logging");

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ANNOUNCEMENT,
    template: "support_created",
    to: params.studentEmail,
    subject: `Support Ticket Created - ${params.ticketNumber}`,
    html,
    text,
    recipientUserId: params.studentId,
    relatedEntityType: "support_ticket",
    relatedEntityId: params.ticketNumber,
    idempotencyKey: generateSupportCreatedKey(params.ticketNumber),
    metadata: {
      studentName: params.studentName,
      ticketNumber: params.ticketNumber,
      subject: params.subject,
    },
  });
}

export interface SupportReplyEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
  replyMessage: string;
  replierName: string;
  messageId: string;
}

export async function sendSupportReplyEmail(params: SupportReplyEmailParams): Promise<void> {
  const { html, text } = (await import("./templates/supportReply")).renderSupportReplyEmail({
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    ticketNumber: params.ticketNumber,
    subject: params.subject,
    replyMessage: params.replyMessage,
    replierName: params.replierName,
  });

  const { generateSupportReplyKey } = await import("./logging");

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ANNOUNCEMENT,
    template: "support_reply",
    to: params.studentEmail,
    subject: `Reply on Support Ticket - ${params.ticketNumber}`,
    html,
    text,
    recipientUserId: params.studentId,
    relatedEntityType: "support_ticket",
    relatedEntityId: params.ticketNumber,
    idempotencyKey: generateSupportReplyKey(params.messageId),
    metadata: {
      studentName: params.studentName,
      ticketNumber: params.ticketNumber,
      subject: params.subject,
      replyMessage: params.replyMessage,
      replierName: params.replierName,
    },
  });
}

export interface AssignmentGradedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  score: number;
  maxScore: number;
  feedback: string;
  gradedAt: Date;
}

export async function sendAssignmentGradedEmail(params: AssignmentGradedEmailParams): Promise<void> {
  const feedbackUrl = `${siteConfig.url}/student/assignments/${params.assignmentId}`;
  const { html, text } = (await import("./templates/assignmentGraded")).renderAssignmentGradedEmail({
    studentName: params.studentName,
    courseName: params.courseName,
    assignmentTitle: params.assignmentTitle,
    score: String(params.score),
    maxScore: String(params.maxScore),
    feedbackUrl,
  });

  const { generateAssignmentGradedKey } = await import("./logging");

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ASSIGNMENT_GRADED,
    template: "assignment_graded",
    to: params.studentEmail,
    subject: `Assignment Graded: ${params.assignmentTitle} - ${siteConfig.name}`,
    html,
    text,
    recipientUserId: params.studentId,
    relatedEntityType: "submission",
    relatedEntityId: params.submissionId,
    idempotencyKey: generateAssignmentGradedKey(params.submissionId),
    metadata: {
      studentName: params.studentName,
      courseName: params.courseName,
      assignmentTitle: params.assignmentTitle,
      score: params.score,
      maxScore: params.maxScore,
      feedback: params.feedback,
      gradedAt: params.gradedAt.toISOString(),
    },
  });
}

export interface SupportResolvedEmailParams {
  studentId: string;
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
}

export async function sendSupportResolvedEmail(params: SupportResolvedEmailParams): Promise<void> {
  const { html, text } = (await import("./templates/supportResolved")).renderSupportResolvedEmail({
    studentName: params.studentName,
    studentEmail: params.studentEmail,
    ticketNumber: params.ticketNumber,
    subject: params.subject,
  });

  const { generateSupportResolvedKey } = await import("./logging");

  await sendTransactionalEmail({
    eventKey: EMAIL_EVENTS.ANNOUNCEMENT,
    template: "support_resolved",
    to: params.studentEmail,
    subject: `Support Ticket Resolved - ${params.ticketNumber}`,
    html,
    text,
    recipientUserId: params.studentId,
    relatedEntityType: "support_ticket",
    relatedEntityId: params.ticketNumber,
    idempotencyKey: generateSupportResolvedKey(params.ticketNumber),
    metadata: {
      studentName: params.studentName,
      ticketNumber: params.ticketNumber,
      subject: params.subject,
    },
  });
}