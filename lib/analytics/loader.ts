/**
 * Phase 19 — Loader that assembles a validated report context for a page from
 * the authenticated session + URL search params. Centralizes range parsing,
 * course-filter validation (IDOR + scope) and ability computation.
 */
"use server";

import { connectDB } from "@/lib/db/connect";
import { Course } from "@/models/Course";
import { Types } from "mongoose";
import type { SessionUser } from "@/lib/auth/session";
import { parseReportRange, type ReportRange } from "./date-range";
import {
  abilitiesFor,
  courseScopeFilterFor,
  type ReportAbilities,
} from "./permissions";
import type { ReportContext } from "./context";

export interface LoadedReport {
  ctx: ReportContext;
  range: ReportRange;
  abilities: ReportAbilities;
  courseOptions: { id: string; name: string }[];
  error?: string;
}

export async function loadReport(
  session: SessionUser,
  params: Record<string, string | string[] | undefined>
): Promise<LoadedReport> {
  const str = (key: string) => {
    const v = params[key];
    return typeof v === "string" ? v : undefined;
  };

  const parsed = parseReportRange({
    range: str("range"),
    preset: str("preset"),
    from: str("from"),
    to: str("to"),
  });
  if (!parsed.range) {
    const fallback = parseReportRange({});
    return {
      ctx: await buildCtx(session, fallback.range!, null, null),
      range: fallback.range!,
      abilities: abilitiesFor(session),
      courseOptions: [],
      error: parsed.error,
    };
  }

  await connectDB();
  const scope = await courseScopeFilterFor(session);

  // Validate courseId (avoid trusting arbitrary strings, spec §110/§111).
  let courseId: string | null = null;
  const rawCourse = str("course");
  if (rawCourse && /^[a-f\d]{24}$/i.test(rawCourse)) {
    const course = await Course.findById(new Types.ObjectId(rawCourse)).select("_id").lean();
    if (course) {
      if (scope) {
        const inScope = scope._id.$in.some(
          (id) => id.toString() === rawCourse
        );
        if (inScope) courseId = rawCourse;
      } else {
        courseId = rawCourse;
      }
    }
  }

  const ctx = await buildCtx(session, parsed.range, courseId, scope);
  const courseOptions = await listCourseOptions(scope);
  return {
    ctx,
    range: parsed.range,
    abilities: abilitiesFor(session),
    courseOptions,
  };
}

async function buildCtx(
  session: SessionUser,
  range: ReportRange,
  courseId: string | null,
  scope: { _id: { $in: Types.ObjectId[] } } | null
): Promise<ReportContext> {
  return { session, range, courseId, scope };
}

async function listCourseOptions(
  scope: { _id: { $in: Types.ObjectId[] } } | null
): Promise<{ id: string; name: string }[]> {
  await connectDB();
  const query = scope ? { _id: { $in: scope._id.$in } } : {};
  const courses = await Course.find(query).select("name").sort({ name: 1 }).lean();
  return courses.map((c) => ({ id: c._id.toString(), name: c.name }));
}