import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Session } from "@/models/Session";
import { Course } from "@/models/Course";
import { SESSION_STATUSES, USER_ROLES } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth/session";
import type {
  OfficeSessionFilters,
  OfficeSessionRow,
  OfficeSessionsResult,
  SessionCourseOption,
} from "./dto";

const ALL_STATUSES = Object.values(SESSION_STATUSES) as string[];

/**
 * Office Sessions queries. Two-role: only ADMIN reaches this area. Admin sees
 * every course's sessions (global scope); others see none.
 */
export async function listOfficeSessions(params: {
  session: SessionUser;
  filters: OfficeSessionFilters;
}): Promise<OfficeSessionsResult> {
  await connectDB();
  const filters = params.filters ?? {};
  const match: Record<string, unknown> = {};

  if (params.session.role !== USER_ROLES.ADMIN) {
    match.course = toObjectId("000000000000000000000000");
  }
  if (filters.courseId && isValidId(filters.courseId)) {
    match.course = toObjectId(filters.courseId);
  }
  if (filters.status && filters.status !== "ALL" && ALL_STATUSES.includes(filters.status)) {
    match.status = filters.status;
  }
  if (filters.upcoming) {
    match.date = { $gte: startOfToday() };
  }

  const docs = await Session.find(match)
    .sort({ date: 1, sortOrder: 1, createdAt: 1 })
    .lean();

  const courseIds = [...new Set(docs.map((s) => s.course.toString()))];
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds.map((id) => toObjectId(id)) } })
        .select("name status")
        .lean()
    : [];
  const courseById = new Map(courses.map((c) => [c._id.toString(), c]));

  const sessions: OfficeSessionRow[] = docs.map((session) => ({
    id: session._id.toString(),
    courseId: session.course.toString(),
    courseName: courseById.get(session.course.toString())?.name ?? "Unknown course",
    courseStatus: courseById.get(session.course.toString())?.status,
    title: session.title,
    date: toDateKey(session.date),
    startTime: session.startTime ?? "",
    endTime: session.endTime ?? "",
    venue: session.venue,
    address: session.address ?? "",
    instructorName: session.instructorName ?? "",
    notes: session.notes ?? "",
    status: session.status,
    isDisplayed: session.isDisplayed,
    sortOrder: session.sortOrder,
    createdAt: session.createdAt.toISOString(),
  }));

  return { sessions, total: sessions.length };
}

export async function getSessionCourseOptions(): Promise<SessionCourseOption[]> {
  await connectDB();
  const courses = await Course.find().select("name").sort({ name: 1 }).lean();
  return courses.map((c) => ({ id: c._id.toString(), name: c.name }));
}

/** Local calendar date key "yyyy-mm-dd" for a Date. */
export function toDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function isValidId(value: string): boolean {
  return Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
}
