import type { Types } from "mongoose";
import { Schema } from "mongoose";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";

export type AuditAction =
  | "dev.test_login"
  | "office.login"
  | "office.logout"
  | "office.password_reset"
  | "office.password_change"
  | "office.profile_update"
  | "staff.create"
  | "staff.update"
  | "staff.activate"
  | "staff.suspend"
  | "staff.role_change"
  | "student.suspend"
  | "student.update"
  | "course.create"
  | "course.update"
  | "course.publish"
  | "course.unpublish"
  | "course.archive"
  | "course.delete"
  | "course.thumbnail_update"
  | "category.create"
  | "module.create"
  | "module.update"
  | "module.delete"
  | "module.reorder"
  | "lesson.create"
  | "lesson.update"
  | "lesson.delete"
  | "lesson.reorder"
  | "resource.upload"
  | "resource.update"
  | "resource.delete"
  | "enrollment.manage"
  | "certificate.revoke"
  | "settings.update"
  | "staff.invite"
  | "office.password_reset_request"
  | "assignment.create"
  | "assignment.update"
  | "assignment.publish"
  | "assignment.unpublish"
  | "assignment.delete"
  | "submission.grade"
  | "submission.regrade"
  | "quiz.create"
  | "quiz.update"
  | "quiz.publish"
  | "quiz.unpublish"
  | "quiz.delete"
  | "quiz.duplicate"
  | "quiz.question.create"
  | "quiz.question.update"
  | "quiz.question.delete"
  | "quiz.question.reorder"
  | "announcement.create"
  | "announcement.update"
  | "announcement.publish"
  | "announcement.archive"
  | "announcement.delete"
  | "support.create"
  | "support.update"
  | "support.reply"
  | "support.resolve"
  | "support.close"
  | "support.reopen"
  | "payment.refund"
  | "session.create"
  | "session.update"
  | "session.delete";

export type AuditEntityType =
  | "user"
  | "staffProfile"
  | "course"
  | "category"
  | "module"
  | "lesson"
  | "resource"
  | "enrollment"
  | "certificate"
  | "payment"
  | "announcement"
  | "settings"
  | "assignment"
  | "submission"
  | "quiz"
  | "question"
  | "session"
  | "support_ticket";

export interface IAuditLog {
  _id: Types.ObjectId;
  createdAt: Date;
  actorUserId: Types.ObjectId;
  actorRole: string;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  ipHash?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    actorRole: { type: String, required: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipHash: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuditLogSchema.index({ actorUserId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

export const AuditLog = defineModel("AuditLog", AuditLogSchema);
