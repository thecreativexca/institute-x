import { connectDB } from "@/lib/db/connect";
import { AuditLog } from "@/lib/mongodb/models";
import type { AuditAction, AuditEntityType } from "@/models/AuditLog";
import { Types } from "mongoose";

export interface RecordAuditEventParams {
  actorUserId: string;
  actorRole: string;
  action: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: {
    ip?: string;
    userAgent?: string;
  };
}

/**
 * Record an audit event for security-sensitive actions.
 * Best-effort: failures are logged but don't break the main flow.
 */
export async function recordAuditEvent(params: RecordAuditEventParams): Promise<void> {
  try {
    await connectDB();

    const ipHash = params.request?.ip
      ? await hashIp(params.request.ip)
      : undefined;

    await AuditLog.create({
      actorUserId: new Types.ObjectId(params.actorUserId),
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ? new Types.ObjectId(params.entityId) : undefined,
      metadata: params.metadata ?? {},
      ipHash,
      userAgent: params.request?.userAgent,
    });
  } catch (error) {
    // Log but don't throw - audit failure shouldn't break the main flow
    console.error("Audit log failed:", error);
  }
}

/**
 * Hash IP address for privacy-compliant storage
 */
async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + "audit-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Predefined audit event helpers for common actions
 */
export const AuditEvents = {
  officeLogin: (userId: string, role: string, request?: { ip?: string; userAgent?: string }) =>
    recordAuditEvent({
      actorUserId: userId,
      actorRole: role,
      action: "office.login",
      request,
    }),

  officeLogout: (userId: string, role: string) =>
    recordAuditEvent({
      actorUserId: userId,
      actorRole: role,
      action: "office.logout",
    }),

  passwordReset: (userId: string, role: string, request?: { ip?: string; userAgent?: string }) =>
    recordAuditEvent({
      actorUserId: userId,
      actorRole: role,
      action: "office.password_reset",
      request,
    }),

  passwordChange: (userId: string, role: string) =>
    recordAuditEvent({
      actorUserId: userId,
      actorRole: role,
      action: "office.password_change",
    }),

  staffCreate: (actorId: string, actorRole: string, staffUserId: string, metadata?: Record<string, unknown>) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "staff.create",
      entityType: "user",
      entityId: staffUserId,
      metadata,
    }),

  staffUpdate: (actorId: string, actorRole: string, staffUserId: string, metadata?: Record<string, unknown>) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "staff.update",
      entityType: "user",
      entityId: staffUserId,
      metadata,
    }),

  staffSuspend: (actorId: string, actorRole: string, staffUserId: string) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "staff.suspend",
      entityType: "user",
      entityId: staffUserId,
    }),

  staffRoleChange: (actorId: string, actorRole: string, staffUserId: string, oldRole: string, newRole: string) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "staff.role_change",
      entityType: "user",
      entityId: staffUserId,
      metadata: { oldRole, newRole },
    }),

  studentSuspend: (actorId: string, actorRole: string, studentId: string) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "student.suspend",
      entityType: "user",
      entityId: studentId,
    }),

  coursePublish: (actorId: string, actorRole: string, courseId: string) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "course.publish",
      entityType: "course",
      entityId: courseId,
    }),

  certificateRevoke: (actorId: string, actorRole: string, certificateId: string) =>
    recordAuditEvent({
      actorUserId: actorId,
      actorRole: actorRole,
      action: "certificate.revoke",
      entityType: "certificate",
      entityId: certificateId,
    }),
};