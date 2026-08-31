import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Category } from "@/models/Category";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Resource } from "@/models/Resource";
import { Enrollment } from "@/models/Enrollment";
import { FacultyCourseAssignment } from "@/models/FacultyCourseAssignment";
import type { SessionUser } from "@/lib/auth/session";
import type { CourseStatus } from "@/lib/constants";
import { USER_ROLES } from "@/lib/constants";
import type {
  CourseCounts,
  CourseListResult,
  CategoryOption,
  OfficeCourseSummary,
  CurriculumData,
  CurriculumLessonDTO,
  CurriculumModuleDTO,
  OfficeCourseDetail,
} from "./dto";
import { parseYouTubeVideoId } from "./youtube";

/** Faculty members only see courses explicitly assigned to them. */
export async function courseScopeFilterFor(
  session: SessionUser
): Promise<Record<string, unknown> | null> {
  if (
    session.role === USER_ROLES.SUPER_ADMIN ||
    session.role === USER_ROLES.CONTENT_MANAGER
  ) {
    return {};
  }
  if (session.role === USER_ROLES.FACULTY) {
    await connectDB();
    const assigned = await FacultyCourseAssignment.find({
      faculty: toObjectId(session.id),
    })
      .select("course")
      .lean();
    return { _id: { $in: assigned.map((a) => a.course) } };
  }
  // Other roles have no course scope unless explicitly granted in future.
  return null;
}

export async function listCourses(params: {
  session: SessionUser;
  filters: CourseListFilters;
  sort: CourseSortField;
  page: number;
  pageSize: number;
}): Promise<CourseListResult> {
  await connectDB();

  const { filters, sort, page, pageSize } = params;
  const scope = await courseScopeFilterFor(params.session);

  const query: Record<string, unknown> = { ...(scope ?? {}) };

  if (filters.search && filters.search.trim()) {
    const regex = new RegExp(escapeRegex(filters.search.trim()), "i");
    query.$or = [{ name: regex }, { slug: regex }, { tags: regex }];
  }
  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  }
  if (filters.categoryId && isValidId(filters.categoryId)) {
    query.category = toObjectId(filters.categoryId);
  }
  if (filters.level) {
    query.level = filters.level;
  }
  if (filters.pricing === "free") query.isFree = true;
  if (filters.pricing === "paid") query.isFree = false;

  const [docs, total] = await Promise.all([
    Course.find(query)
      .select(
        "name slug status category level price currency isFree thumbnailUrl updatedAt"
      )
      .sort(SORT_MAP[sort] ?? SORT_MAP.recently_updated)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Course.countDocuments(query),
  ]);

  const categoryIds = [...new Set(docs.map((c) => String(c.category)))];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds.map((id) => toObjectId(id)) } })
        .select("name")
        .lean()
    : [];
  const categoryNameById = new Map(categories.map((c) => [String(c._id), c.name]));

  const courseIds = docs.map((c) => c._id);

  // Batched counts — never per-course N+1 queries (req. 106/109).
  const [moduleCounts, lessonCounts, publishedCounts, enrollmentCounts] =
    await Promise.all([
      Module.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: "$course", total: { $sum: 1 } } },
      ]),
      Lesson.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: "$course", total: { $sum: 1 } } },
      ]),
      Lesson.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { course: { $in: courseIds }, isPublished: true } },
        { $group: { _id: "$course", total: { $sum: 1 } } },
      ]),
      Enrollment.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { course: { $in: courseIds } } },
        { $group: { _id: "$course", total: { $sum: 1 } } },
      ]),
    ]);

  const mapOf = (rows: { _id: Types.ObjectId; total: number }[]) =>
    new Map(rows.map((r) => [r._id.toString(), r.total]));

  const moduleMap = mapOf(moduleCounts);
  const lessonMap = mapOf(lessonCounts);
  const publishedMap = mapOf(publishedCounts);
  const enrollmentMap = mapOf(enrollmentCounts);

  const courses: OfficeCourseSummary[] = docs.map((course) => ({
    id: course._id.toString(),
    name: course.name,
    slug: course.slug,
    status: course.status as CourseStatus,
    categoryName: categoryNameById.get(String(course.category)) ?? "Uncategorized",
    level: course.level,
    isFree: course.isFree,
    price: course.isFree ? null : (course.price ?? null),
    currency: course.currency,
    thumbnailUrl: course.thumbnailUrl ?? null,
    moduleCount: moduleMap.get(course._id.toString()) ?? 0,
    lessonCount: lessonMap.get(course._id.toString()) ?? 0,
    publishedLessonCount: publishedMap.get(course._id.toString()) ?? 0,
    enrollmentCount: enrollmentMap.get(course._id.toString()) ?? 0,
    updatedAt: course.updatedAt.toISOString(),
  }));

  return {
    courses,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCategoryOptions(): Promise<CategoryOption[]> {
  await connectDB();
  const categories = await Category.find()
    .select("name")
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return categories.map((c) => ({ id: c._id.toString(), name: c.name }));
}

export async function getCourseCounts(courseId: string): Promise<CourseCounts> {
  await connectDB();
  const courseOid = toObjectId(courseId);

  const [modules, lessons, publishedLessons, resources, enrollments] =
    await Promise.all([
      Module.countDocuments({ course: courseOid }),
      Lesson.countDocuments({ course: courseOid }),
      Lesson.countDocuments({ course: courseOid, isPublished: true }),
      Resource.countDocuments({ course: courseOid }),
      Enrollment.countDocuments({ course: courseOid }),
    ]);

  return {
    modules,
    lessons,
    publishedLessons,
    draftLessons: lessons - publishedLessons,
    resources,
    enrollments,
  };
}

export async function getCourseDetail(
  courseId: string
): Promise<OfficeCourseDetail | null> {
  await connectDB();
  if (!isValidId(courseId)) return null;

  const course = await Course.findById(toObjectId(courseId))
    .populate<{ category: { _id: Types.ObjectId; name?: string } | null }>("category", "name")
    .lean();
  if (!course) return null;

  const category = course.category as unknown as
    | { _id?: Types.ObjectId; name?: string }
    | null;
  const counts = await getCourseCounts(courseId);

  return {
    id: course._id.toString(),
    name: course.name,
    slug: course.slug,
    status: course.status as CourseStatus,
    categoryId: String(course.category?._id ?? course.category),
    categoryName: category?.name ?? "Uncategorized",
    shortDescription: course.shortDescription ?? "",
    description: course.description ?? "",
    level: course.level,
    learningMode: course.learningMode ?? "online",
    durationWeeks: course.durationWeeks ?? null,
    isFree: course.isFree,
    isPurchasable: course.isPurchasable,
    price: course.isFree ? null : (course.price ?? null),
    compareAtPrice: course.compareAtPrice ?? null,
    currency: course.currency,
    thumbnailUrl: course.thumbnailUrl ?? null,
    instructorName: course.instructorName ?? "",
    tags: course.tags ?? [],
    learningOutcomes: course.learningOutcomes ?? [],
    requirements: course.requirements ?? [],
    targetAudience: course.targetAudience ?? [],
    faqs: course.faqs ?? [],
    seoTitle: course.seoTitle ?? "",
    seoDescription: course.seoDescription ?? "",
    isDisplayed: course.isDisplayed,
    createdBy: course.createdBy?.toString() ?? null,
    updatedBy: course.updatedBy?.toString() ?? null,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    counts,
  };
}

/**
 * Full curriculum for the office curriculum manager: modules with lessons and
 * per-lesson resources, fetched with batched queries (no N+1).
 */
export async function getCourseCurriculum(
  courseId: string
): Promise<CurriculumData | null> {
  await connectDB();
  if (!isValidId(courseId)) return null;

  const course = await Course.findById(toObjectId(courseId))
    .select("name slug status")
    .lean();
  if (!course) return null;

  const [modules, lessons] = await Promise.all([
    Module.find({ course: course._id }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Lesson.find({ course: course._id })
      .select(
        "module title content videoUrl durationMinutes isPublished isPreview sortOrder"
      )
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean(),
  ]);

  const lessonIds = lessons.map((l) => l._id);
  const resources = lessonIds.length
    ? await Resource.find({ lesson: { $in: lessonIds } })
        .select(
          "lesson title description type access isPublished fileSize originalFileName sortOrder"
        )
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean()
    : [];

  const resourcesByLesson = new Map<string, (typeof resources)[number][]>();
  for (const resource of resources) {
    const key = String(resource.lesson);
    const list = resourcesByLesson.get(key) ?? [];
    list.push(resource);
    resourcesByLesson.set(key, list);
  }

  const modulesDTO: CurriculumModuleDTO[] = modules.map((module) => {
    const moduleLessons: CurriculumLessonDTO[] = lessons
      .filter((lesson) => String(lesson.module) === String(module._id))
      .map((lesson) => {
        const lessonResources = resourcesByLesson.get(String(lesson._id)) ?? [];
        return {
          id: lesson._id.toString(),
          title: lesson.title,
          description: lesson.content ?? "",
          videoUrl: lesson.videoUrl ?? null,
          videoId: lesson.videoUrl
            ? parseYouTubeVideoId(lesson.videoUrl)
            : null,
          durationMinutes: lesson.durationMinutes ?? null,
          isPublished: lesson.isPublished,
          isPreview: lesson.isPreview,
          sortOrder: lesson.sortOrder,
          resourceCount: lessonResources.length,
          resources: lessonResources.map((resource) => ({
            id: resource._id.toString(),
            title: resource.title,
            description: resource.description ?? "",
            type: resource.type,
            access: resource.access,
            isPublished: resource.isPublished,
            fileSize: resource.fileSize,
            originalFileName: resource.originalFileName,
            fileUrl: resource.fileUrl,
            sortOrder: resource.sortOrder,
          })),
        };
      });

    return {
      id: module._id.toString(),
      title: module.title,
      description: module.description ?? "",
      isPublished: (module as unknown as { isPublished?: boolean }).isPublished ?? true,
      sortOrder: module.sortOrder,
      lessons: moduleLessons,
    };
  });

  const totalLessons = modulesDTO.reduce((sum, m) => sum + m.lessons.length, 0);
  const publishedLessons = modulesDTO.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isPublished).length,
    0
  );
  const totalResources = modulesDTO.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.resources.length, 0),
    0
  );

  return {
    course: {
      id: course._id.toString(),
      name: course.name,
      slug: course.slug,
      status: course.status as CourseStatus,
    },
    modules: modulesDTO,
    counts: {
      modules: modulesDTO.length,
      lessons: totalLessons,
      publishedLessons,
      draftLessons: totalLessons - publishedLessons,
      resources: totalResources,
    },
  };
}

/**
 * Office-scoped course queries (req. 121): office reads see draft, published
 * AND archived courses. Public/Student queries live in their own modules and
 * never reuse this file, so drafts can never leak into student routes.
 */

export type CourseSortField =
  | "recently_updated"
  | "newest"
  | "oldest"
  | "name_a_z"
  | "name_z_a";

export interface CourseListFilters {
  search?: string;
  status?: CourseStatus | "ALL";
  categoryId?: string;
  level?: string;
  pricing?: "free" | "paid" | "ALL";
}

const SORT_MAP: Record<CourseSortField, Record<string, 1 | -1>> = {
  recently_updated: { updatedAt: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name_a_z: { name: 1 },
  name_z_a: { name: -1 },
};

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isValidId(value: string): boolean {
  return Types.ObjectId.isValid(value) && /^[0-9a-fA-F]{24}$/.test(value);
}