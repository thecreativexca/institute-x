import { EMAIL_EVENTS, type EmailEventKey, type EmailStatus } from "./logging";

export { EMAIL_EVENTS, type EmailEventKey, EMAIL_STATUSES, type EmailStatus } from "./logging";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey?: string;
  recipientUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  eventKey: EmailEventKey;
  template: string;
}

export interface SendEmailResult {
  success: boolean;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  logId?: string;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface VerificationEmailData extends EmailTemplateData {
  studentName: string;
  verificationUrl: string;
  expiryHours: number;
}

export interface PasswordResetEmailData extends EmailTemplateData {
  studentName: string;
  resetUrl: string;
  expiryMinutes: number;
}

export interface WelcomeEmailData extends EmailTemplateData {
  studentName: string;
  dashboardUrl: string;
  coursesUrl: string;
}

export interface EnrollmentConfirmedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  enrollmentDate: string;
  courseUrl: string;
  dashboardUrl: string;
  amount?: string;
  currency?: string;
}

export interface PaymentConfirmedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  amount: string;
  currency: string;
  paymentDate: string;
  receiptNumber: string;
  paymentId: string;
  courseUrl: string;
  dashboardUrl: string;
}

export interface AssignmentSubmittedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  assignmentTitle: string;
  submissionNumber: number;
  submissionTime: string;
  submissionUrl: string;
}

export interface CourseCompletedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  completionDate: string;
  progressUrl: string;
  certificateStatus: string;
}

export interface CertificateIssuedEmailData extends EmailTemplateData {
  studentName: string;
  courseName: string;
  certificateNumber: string;
  issuedDate: string;
  certificateUrl: string;
  verificationUrl: string;
}

export interface AnnouncementEmailData extends EmailTemplateData {
  studentName: string;
  announcementTitle: string;
  announcementBody: string;
  publishedAt: string;
  announcementUrl?: string;
}

export interface SupportCreatedEmailData extends EmailTemplateData {
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
}

export interface SupportReplyEmailData extends EmailTemplateData {
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
  replyMessage: string;
  replierName: string;
}

export interface SupportResolvedEmailData extends EmailTemplateData {
  studentName: string;
  studentEmail: string;
  ticketNumber: string;
  subject: string;
}