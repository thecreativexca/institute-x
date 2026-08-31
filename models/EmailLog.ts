import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";

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

export interface IEmailLog {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  eventKey: EmailEventKey;
  recipient: string;
  recipientUserId?: Types.ObjectId;
  template: string;
  subject: string;
  provider: string;
  providerMessageId?: string;
  status: EmailStatus;
  attemptCount: number;
  lastAttemptAt?: Date | null;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorCode?: string;
  errorMessageSafe?: string;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    eventKey: {
      type: String,
      enum: Object.values(EMAIL_EVENTS),
      required: true,
      index: true,
    },
    recipient: { type: String, required: true, index: true },
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      index: true,
    },
    template: { type: String, required: true },
    subject: { type: String, required: true },
    provider: { type: String, required: true, default: "resend" },
    providerMessageId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: Object.values(EMAIL_STATUSES),
      default: EMAIL_STATUSES.PENDING,
      index: true,
    },
    attemptCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    errorCode: { type: String },
    errorMessageSafe: { type: String },
    relatedEntityType: { type: String, index: true },
    relatedEntityId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
      unique: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

EmailLogSchema.index({ recipientUserId: 1, createdAt: -1 });
EmailLogSchema.index({ eventKey: 1, createdAt: -1 });
EmailLogSchema.index({ status: 1, createdAt: -1 });

export const EmailLog = defineModel("EmailLog", EmailLogSchema);