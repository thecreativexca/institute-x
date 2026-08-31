export {
  getResendClient,
  getResendFromEmail,
  getResendFromName,
} from "./client";

export {
  sendTransactionalEmail,
  generateIdempotencyKey,
  EMAIL_EVENTS,
  type EmailEventKey,
} from "./send-email";

export {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendEnrollmentConfirmedEmail,
  sendPaymentConfirmedEmail,
  sendAssignmentSubmittedEmail,
  sendCourseCompletedEmail,
  sendCertificateIssuedEmail,
  sendAnnouncementEmail,
} from "./events";

export {
  createEmailLog,
  updateEmailLog,
  getEmailLogById,
  getEmailLogsByUser,
  getFailedEmailLogs,
  retryEmailLog,
  generatePaymentConfirmationKey,
  generateEnrollmentConfirmationKey,
  generateAssignmentSubmissionKey,
  generateCertificateIssuedKey,
  generateCourseCompletedKey,
  generateVerificationKey,
  generateWelcomeKey,
  generatePasswordResetKey,
} from "./logging";

export {
  type SendEmailOptions,
  type SendEmailResult,
  type EmailTemplateData,
  type VerificationEmailData,
  type PasswordResetEmailData,
  type WelcomeEmailData,
  type EnrollmentConfirmedEmailData,
  type PaymentConfirmedEmailData,
  type AssignmentSubmittedEmailData,
  type CourseCompletedEmailData,
  type CertificateIssuedEmailData,
  type AnnouncementEmailData,
} from "./types";