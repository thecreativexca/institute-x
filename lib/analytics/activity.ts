/**
 * Phase 19 — Office activity / audit viewer (Part J, spec §69–§74).
 *
 * CALLER MUST gate with `audit.read`. Audit logs are read-only; no edit/delete
 * ever. Summaries are built from a safe whitelist so secrets (tokens, hashes,
 * payment signatures, API keys) are never rendered (spec §73, §142).
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { AuditLog } from "@/models/AuditLog";
import { User } from "@/models/User";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { auditGroupFor, summarizeAudit } from "./activity-utils";
import type { AuditFilter, AuditEntry, AuditPage } from "./activity-types";

export async function getAuditLogs(
  ctx: ReportContext,
  filter: AuditFilter,
  page: number,
  limit: number
): Promise<AuditPage> {
  await connectDB();
  const query: Record<string, unknown> = {
    createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
  };
  if (filter.actorId && /^[a-f\d]{24}$/i.test(filter.actorId)) {
    query.actorUserId = new Types.ObjectId(filter.actorId);
  }
  if (filter.role) query.actorRole = filter.role;
  if (filter.action) query.action = filter.action;
  if (filter.entityType) query.entityType = filter.entityType;

  const skip = (page - 1) * limit;
  const [rows, total] = await Promise.all([
    AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AuditLog.countDocuments(query),
  ]);

  const actorIds = [...new Set(rows.map((r) => r.actorUserId.toString()))];
  const actors = actorIds.length
    ? await User.find({ _id: { $in: actorIds.map((a) => new Types.ObjectId(a)) } })
        .select("name")
        .lean()
    : [];
  const actorName = new Map(actors.map((a) => [a._id.toString(), a.name]));

  const entries: AuditEntry[] = rows.map((r) => ({
    id: r._id.toString(),
    actorUserId: r.actorUserId.toString(),
    actorName: actorName.get(r.actorUserId.toString()) ?? "Unknown user",
    actorRole: r.actorRole,
    action: r.action,
    entityType: r.entityType ?? null,
    entityId: r.entityId ? r.entityId.toString() : null,
    timestamp: r.createdAt.toISOString(),
    summary: summarizeAudit(r.action, r.metadata),
    group: auditGroupFor(r.action),
  }));

  return {
    entries,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** Distinct actor roles seen in the range (for the actor filter dropdown). */
export async function getAuditRoles(ctx: ReportContext): Promise<string[]> {
  await connectDB();
  const rows = await AuditLog.aggregate<{ _id: string }>([
    { $match: { createdAt: { $gte: ctx.range.from, $lt: ctx.range.to } } },
    { $group: { _id: "$actorRole" } },
    { $sort: { _id: 1 } },
  ]);
  return rows.map((r) => r._id);
}