import { connectDB } from "@/lib/db/connect";
import { Announcement } from "@/models/Announcement";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Types } from "mongoose";
import {
  OfficeAnnouncementSummary,
  OfficeAnnouncementDetail,
  AnnouncementFilters,
  AnnouncementSortOptions,
  PaginationParams,
  AnnouncementListResult,
  AnnouncementAudienceResult,
} from "./dto";
import { AUDIENCES, type Audience } from "@/lib/constants";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getOfficeAnnouncements(
  filters: AnnouncementFilters,
  sort: AnnouncementSortOptions,
  pagination: PaginationParams
): Promise<AnnouncementListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    query.title = regex;
  }

  if (filters.audience && filters.audience !== "all") {
    query.audience = filters.audience;
  }

  if (filters.status === "active") {
    query.isActive = true;
  } else if (filters.status === "inactive") {
    query.isActive = false;
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [announcements, total] = await Promise.all([
    Announcement.find(query)
      .populate({ path: "createdBy", select: "name" })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Announcement.countDocuments(query),
  ]);

  if (announcements.length === 0) {
    return {
      announcements: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const courseIds = announcements
    .filter((a) => a.audience === AUDIENCES.STUDENTS)
    .map((a) => a.course)
    .filter((id): id is Types.ObjectId => id != null);

  const courses = courseIds.length > 0
    ? await Course.find({ _id: { $in: courseIds } }).select("name").lean()
    : [];
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const announcementSummaries: OfficeAnnouncementSummary[] = announcements.map((announcement) => {
    const createdBy = announcement.createdBy as unknown as { _id: Types.ObjectId; name: string } | null;
    const courseName = announcement.audience === AUDIENCES.STUDENTS && announcement.course
      ? courseMap.get(announcement.course.toString()) ?? null
      : null;

    return {
      id: announcement._id.toString(),
      title: announcement.title,
      audience: announcement.audience,
      courseId: announcement.course?.toString() ?? null,
      courseName,
      isActive: announcement.isActive,
      publishedAt: announcement.publishedAt?.toISOString() ?? null,
      createdById: createdBy?._id.toString() ?? "",
      createdByName: createdBy?.name ?? "Unknown",
      updatedAt: announcement.updatedAt.toISOString(),
    };
  });

  return {
    announcements: announcementSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeAnnouncementById(
  announcementId: string
): Promise<OfficeAnnouncementDetail | null> {
  await connectDB();

  const announcement = await Announcement.findById(toObjectId(announcementId))
    .populate({ path: "createdBy", select: "name" })
    .lean();

  if (!announcement) return null;

  const createdBy = announcement.createdBy as unknown as { _id: Types.ObjectId; name: string } | null;
  let courseName: string | null = null;

  if (announcement.audience === AUDIENCES.STUDENTS && announcement.course) {
    const course = await Course.findById(announcement.course).select("name").lean();
    courseName = course?.name ?? null;
  }

  return {
    id: announcement._id.toString(),
    title: announcement.title,
    audience: announcement.audience,
    courseId: announcement.course?.toString() ?? null,
    courseName,
    isActive: announcement.isActive,
    publishedAt: announcement.publishedAt?.toISOString() ?? null,
    createdById: createdBy?._id.toString() ?? "",
    createdByName: createdBy?.name ?? "Unknown",
    updatedAt: announcement.updatedAt.toISOString(),
    body: announcement.body,
    sendEmail: false,
    createdAt: announcement.createdAt.toISOString(),
  };
}

export async function getAnnouncementAudience(
  audience: Audience,
  courseId?: string | null
): Promise<AnnouncementAudienceResult> {
  await connectDB();

  if (audience === AUDIENCES.ALL) {
    const studentIds = await User.find({ role: "student", status: "active" })
      .select("_id")
      .lean()
      .then((users) => users.map((u) => u._id.toString()));
    return { studentIds, count: studentIds.length };
  }

  if (audience === AUDIENCES.STUDENTS) {
    if (!courseId || !Types.ObjectId.isValid(courseId)) {
      return { studentIds: [], count: 0 };
    }
    const enrollments = await Enrollment.find({
      course: toObjectId(courseId),
      status: "active",
    })
      .select("student")
      .lean();
    const studentIds = enrollments.map((e) => e.student.toString());
    return { studentIds, count: studentIds.length };
  }

  // Two-role system: no staff audience. Announcements target all students
  // (AUDIENCES.ALL) or students of a specific course (AUDIENCES.STUDENTS).
  return { studentIds: [], count: 0 };
}