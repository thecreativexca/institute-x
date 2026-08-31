import { connectDB } from "@/lib/db/connect";
import { EmailLog, type IEmailLog } from "@/lib/mongodb/models";
import { Types } from "mongoose";

export const EMAIL_EVENTS = {
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
  WELCOME: "welcome",
  ENROLLMENT_CONFIRMED: "enrollment_confirmed",
  PAYMENT_CONFIRMED: "payment_confirmed",
  ASSIGNMENT_SUBMITTED: "assignment_submitted",
  ASSIGNMENT_GRADED: "assignment_graded",
  QUIZ_COMPLETED: "quiz_completed",
  COURSE_COMPLETED: "course_completed",
  CERTIFICATE_ISSUED: "certificate_issued",
  ANNOUNCEMENT: "announcement",
} as const;

export type EmailEventKey = (typeof EMAIL_EVENTS)[keyof typeof EMAIL_EVENTS];

export const EMAIL_STATUSES = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
} as const;

export type EmailStatus = (typeof EMAIL_STATUSES)[keyof typeof EMAIL_STATUSES];

export interface CreateEmailLogParams {
  eventKey: EmailEventKey;
  recipient: string;
  recipientUserId?: string;
  template: string;
  subject: string;
  idempotencyKey?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateEmailLogParams {
  status: EmailStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessageSafe?: string;
}

export async function createEmailLog(params: CreateEmailLogParams): Promise<{
  logId: string;
  isDuplicate: boolean;
}> {
  await connectDB();

  // If idempotency key provided, check for existing log
  if (params.idempotencyKey) {
    const existing = await EmailLog.findOne({
      idempotencyKey: params.idempotencyKey,
    }).select("_id status").lean();

    if (existing) {
      return {
        logId: existing._id.toString(),
        isDuplicate: true,
      };
    }
  }

  const log = await EmailLog.create({
    eventKey: params.eventKey,
    recipient: params.recipient,
    recipientUserId: params.recipientUserId ? new Types.ObjectId(params.recipientUserId) : undefined,
    template: params.template,
    subject: params.subject,
    provider: "resend",
    status: EMAIL_STATUSES.PENDING,
    attemptCount: 0,
    idempotencyKey: params.idempotencyKey,
    relatedEntityType: params.relatedEntityType,
    relatedEntityId: params.relatedEntityId ? new Types.ObjectId(params.relatedEntityId) : undefined,
    metadata: params.metadata || {},
  });

  return {
    logId: log._id.toString(),
    isDuplicate: false,
  };
}

export async function updateEmailLog(
  logId: string,
  params: UpdateEmailLogParams
): Promise<void> {
  await connectDB();

  const update: Record<string, unknown> = {
    status: params.status,
    $inc: { attemptCount: 1 },
    lastAttemptAt: new Date(),
  };

  if (params.providerMessageId) {
    update.providerMessageId = params.providerMessageId;
  }

  if (params.status === EMAIL_STATUSES.SENT) {
    update.sentAt = new Date();
  } else if (params.status === EMAIL_STATUSES.FAILED) {
    update.failedAt = new Date();
    if (params.errorCode) update.errorCode = params.errorCode;
    if (params.errorMessageSafe) update.errorMessageSafe = params.errorMessageSafe;
  }

  await EmailLog.findByIdAndUpdate(logId, update);
}

export async function getEmailLogByIdempotencyKey(idempotencyKey: string): Promise<IEmailLog | null> {
  await connectDB();
  return EmailLog.findOne({ idempotencyKey }).lean();
}

export async function getEmailLogById(logId: string) {
  await connectDB();
  const { Types } = await import("mongoose");
  return EmailLog.findById(new Types.ObjectId(logId)).lean();
}

export async function getEmailLogsByUser(
  userId: string,
  options?: { limit?: number; status?: EmailStatus }
): Promise<IEmailLog[]> {
  await connectDB();
  const query: Record<string, unknown> = { recipientUserId: new Types.ObjectId(userId) };
  if (options?.status) {
    query.status = options.status;
  }
  return EmailLog.find(query)
    .sort({ createdAt: -1 })
    .limit(options?.limit || 50)
    .lean();
}

export async function getFailedEmailLogs(
  options?: { limit?: number; since?: Date }
): Promise<IEmailLog[]> {
  await connectDB();
  const query: Record<string, unknown> = { status: EMAIL_STATUSES.FAILED };
  if (options?.since) {
    query.createdAt = { $gte: options.since };
  }
  return EmailLog.find(query)
    .sort({ createdAt: -1 })
    .limit(options?.limit || 100)
    .lean();
}

export async function retryEmailLog(logId: string): Promise<{ success: boolean; error?: string }> {
  await connectDB();
  const log = await EmailLog.findById(logId).lean();
  if (!log) {
    return { success: false, error: "Email log not found" };
  }

  if (log.status === EMAIL_STATUSES.SENT) {
    return { success: false, error: "Email already sent" };
  }

  // Reset for retry
  await EmailLog.findByIdAndUpdate(logId, {
    status: EMAIL_STATUSES.PENDING,
    $inc: { attemptCount: 1 },
    lastAttemptAt: new Date(),
    errorCode: null,
    errorMessageSafe: null,
    failedAt: null,
  });

  return { success: true };
}

export function generateIdempotencyKey(eventKey: EmailEventKey, entityId: string): string {
  return `${eventKey}:${entityId}`;
}

export function generatePaymentConfirmationKey(paymentId: string): string {
  return `payment-confirmed:${paymentId}`;
}

export function generateEnrollmentConfirmationKey(enrollmentId: string): string {
  return `enrollment-confirmed:${enrollmentId}`;
}

export function generateAssignmentSubmissionKey(submissionId: string): string {
  return `assignment-submitted:${submissionId}`;
}

export function generateAssignmentGradedKey(submissionId: string): string {
  return `assignment-graded:${submissionId}`;
}

export function generateCertificateIssuedKey(certificateId: string): string {
  return `certificate-issued:${certificateId}`;
}

export function generateCourseCompletedKey(enrollmentId: string): string {
  return `course-completed:${enrollmentId}`;
}

export function generateVerificationKey(userId: string): string {
  return `email-verification:${userId}`;
}

export function generateWelcomeKey(userId: string): string {
  return `welcome:${userId}`;
}

export function generatePasswordResetKey(userId: string): string {
  return `password-reset:${userId}`;
}

export function generateSupportCreatedKey(ticketNumber: string): string {
  return `support-created:${ticketNumber}`;
}

export function generateSupportReplyKey(messageId: string): string {
  return `support-reply:${messageId}`;
}

export function generateSupportResolvedKey(ticketNumber: string): string {
  return `support-resolved:${ticketNumber}`;
}