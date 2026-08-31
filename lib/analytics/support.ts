/**
 * Phase 19 — Support analytics (Part I, spec §63–§68).
 *
 * CALLER MUST gate with `support.read` before calling.
 * Resolution time uses ONLY tickets with a resolvedAt timestamp, computed as
 * resolvedAt − createdAt (closing later never changes it, spec §141).
 * First-response time = time from creation to the first STAFF message.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { SupportTicket } from "@/models/SupportTicket";
import { Types } from "mongoose";
import type { ReportContext } from "./context";
import { dayBucketSpec } from "./context";
import { fillSeries } from "./date-range";
import type { TicketStatus } from "@/lib/constants";

const ACTIVE_STATUSES: readonly TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_for_student",
];

export interface SupportCategoryStat {
  category: string;
  count: number;
  resolved: number;
  avgResolutionMs: number | null;
}

export interface BacklogBucket {
  label: string;
  minHours: number;
  count: number;
}

export interface SupportAnalytics {
  byStatus: Record<string, number>;
  highUrgent: number;
  unassigned: number;
  volumeTrend: { label: string; count: number }[];
  avgResolutionMs: number | null;
  medianResolutionMs: number | null;
  avgFirstResponseMs: number | null;
  firstResponseDetected: boolean;
  backlog: BacklogBucket[];
  byCategory: SupportCategoryStat[];
}

export async function getSupportAnalytics(
  ctx: ReportContext
): Promise<SupportAnalytics> {
  await connectDB();
  const scopeSel = supportScopeSelector(ctx);

  const [statusRows, highUrgent, unassigned, volumeRaw] = await Promise.all([
    SupportTicket.aggregate<{ _id: string; count: number }>([
      { $match: scopeSel },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    SupportTicket.countDocuments({
      ...scopeSel,
      status: { $in: ACTIVE_STATUSES },
      priority: { $in: ["high", "urgent"] },
    }),
    SupportTicket.countDocuments({
      ...scopeSel,
      status: { $in: ACTIVE_STATUSES },
      assignedTo: null,
    }),
    SupportTicket.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          ...scopeSel,
          createdAt: { $gte: ctx.range.from, $lt: ctx.range.to },
        },
      },
      { $group: { _id: dayBucketSpec("createdAt"), count: { $sum: 1 } } },
    ]),
  ]);

  const byStatus: Record<string, number> = {};
  for (const r of statusRows) byStatus[r._id] = r.count;

  const volumeMap: Record<string, number> = {};
  for (const r of volumeRaw) volumeMap[r._id] = r.count;
  const volumeTrend = fillSeries(volumeMap, ctx.range, () => 0).map((s) => ({
    label: s.label,
    count: s.value,
  }));
// Resolved tickets in the range for resolution + first-response + category.
  const resolved = await SupportTicket.find({
    ...scopeSel,
    resolvedAt: { $gte: ctx.range.from, $lt: ctx.range.to },
  })
    .select("createdAt resolvedAt category messages.status messages.senderType messages.createdAt")
    .lean();

  const durations: number[] = [];
  const firstResponses: number[] = [];
  const catMap = new Map<string, { count: number; sumMs: number }>();
  for (const t of resolved) {
    if (!t.resolvedAt) continue;
    const dur = t.resolvedAt.getTime() - t.createdAt.getTime();
    if (dur >= 0) durations.push(dur);
    // First response: earliest staff message.
    const staffMsg = (t.messages ?? [])
      .filter((m) => m.senderType === "staff")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    if (staffMsg) {
      const fr = staffMsg.createdAt.getTime() - t.createdAt.getTime();
      if (fr >= 0) firstResponses.push(fr);
    }
    const cat = t.category ?? "other";
    const entry = catMap.get(cat) ?? { count: 0, sumMs: 0 };
    entry.count += 1;
    entry.sumMs += dur;
    catMap.set(cat, entry);
  }

  const avgResolutionMs =
    durations.length > 0 ? durations.reduce((s, d) => s + d, 0) / durations.length : null;
  const sorted = [...durations].sort((a, b) => a - b);
  const medianResolutionMs =
    sorted.length > 0
      ? sorted.length % 2 === 1
        ? sorted[Math.floor(sorted.length / 2)]
        : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : null;
  const avgFirstResponseMs =
    firstResponses.length > 0
      ? firstResponses.reduce((s, d) => s + d, 0) / firstResponses.length
      : null;

  const byCategory: SupportCategoryStat[] = [...catMap.entries()].map(([category, v]) => ({
    category,
    count: v.count,
    resolved: v.count,
    avgResolutionMs: v.count > 0 ? v.sumMs / v.count : null,
  }));

  // Backlog bucket for currently-open tickets, aged with server time.
  const now = Date.now();
  const openTickets = await SupportTicket.find({
    ...scopeSel,
    status: { $in: ACTIVE_STATUSES },
  })
    .select("createdAt")
    .lean();
  const hoursAge = openTickets.map((t) => (now - t.createdAt.getTime()) / 3_600_000);
  const backlog: BacklogBucket[] = [
    { label: "< 24h", minHours: 0, count: hoursAge.filter((h) => h < 24).length },
    { label: "1–3 days", minHours: 24, count: hoursAge.filter((h) => h >= 24 && h < 72).length },
    { label: "3–7 days", minHours: 72, count: hoursAge.filter((h) => h >= 72 && h < 168).length },
    { label: "> 7 days", minHours: 168, count: hoursAge.filter((h) => h >= 168).length },
  ];

  return {
    byStatus,
    highUrgent,
    unassigned,
    volumeTrend,
    avgResolutionMs,
    medianResolutionMs,
    avgFirstResponseMs,
    firstResponseDetected: firstResponses.length > 0,
    backlog,
    byCategory,
  };
}

function supportScopeSelector(ctx: ReportContext): Record<string, unknown> {
  // Support tickets reference an optional course; a scope filter restricts to
  // tickets linked to courses within the user's scope.
  if (ctx.scope) {
    return { $or: [{ course: null }, { course: { $in: ctx.scope._id.$in } }] };
  }
  if (ctx.courseId && /^[a-f\d]{24}$/i.test(ctx.courseId)) {
    return { course: new Types.ObjectId(ctx.courseId) };
  }
  return {};
}