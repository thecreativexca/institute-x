/**
 * Phase 19 — Shared report context + aggregation helpers.
 *
 * Encapsulates the fixed date window, optional validated course filter and the
 * permission-aware course scope so every aggregator applies the SAME filtering
 * (never stray allowlists / never raw user input).
 */

import type { Types } from "mongoose";
import { Types as MongooseTypes } from "mongoose";

import type { ReportRange } from "./date-range";
import type { SessionUser } from "@/lib/auth/session";
import { REPORTING_TIME_ZONE } from "./date-range";

export interface ReportContext {
  session: SessionUser;
  range: ReportRange;
  /** Validated courseId (null = all courses). */
  courseId: string | null;
  scope: { _id: { $in: Types.ObjectId[] } } | null;
}

export interface CourseOption {
  id: string;
  name: string;
}

/**
 * Build the shared `course` selector for a context: applied scope first, then
 * the explicit validated course filter.
 */
export function courseSelector(ctx: ReportContext): Record<string, unknown> {
  if (ctx.courseId && /^[a-f\d]{24}$/i.test(ctx.courseId)) {
    return { course: new MongooseTypes.ObjectId(ctx.courseId) };
  }
  if (ctx.scope) {
    return { course: { $in: ctx.scope._id.$in } };
  }
  return {};
}

/** Build a {$match} stage for the ctx date window on a given date field. */
export function matchInRange(
  ctx: ReportContext,
  dateField: string = "createdAt"
): Record<string, unknown> {
  return { [dateField]: { $gte: ctx.range.from, $lt: ctx.range.to } };
}

/** Mongo `$dateToString` day-key spec using the reporting timezone. */
export function dayBucketSpec(dateField: string): Record<string, unknown> {
  return {
    date: `$${dateField}`,
    format: "%Y-%m-%d",
    timezone: REPORTING_TIME_ZONE,
  };
}

/** Reduce agg rows keyed by day string into a Record<string,count>. */
export function toCountMap<T>(rows: { key?: string; _id?: string; count: number }[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of rows) {
    const key = r.key ?? r._id;
    if (!key) continue;
    map[key] = (map[key] ?? 0) + r.count;
  }
  return map;
}