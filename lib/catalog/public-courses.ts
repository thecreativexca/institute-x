import { connectDB } from "@/lib/db/connect";
import { Course } from "@/models/Course";
import { Category } from "@/models/Category";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { COURSE_STATUSES, type CourseStatus } from "@/lib/constants";
import {
  CATALOG_COURSES,
  type CatalogCourse,
  type CatalogModule,
} from "@/lib/config/catalog";

function getCatalogFallbackCourses(): CatalogCourse[] {
  return CATALOG_COURSES.filter(
    (course) => (course.status as CourseStatus) === COURSE_STATUSES.PUBLISHED
  ).map((course) => ({
    ...course,
    // Reference catalog records do not exist in MongoDB, so checkout and
    // enrollment must stay disabled until staff publish real course records.
    isPurchasable: false,
  }));
}

/**
 * Public catalog queries (Phase 17, req. 74–76). MongoDB is authoritative:
 * only PUBLISHED (+displayed) courses are returned. When the database is
 * empty (fresh dev environment), the static catalog reference data is used as
 * a documented development fallback so the public site is never blank.
 *
 * Draft and archived courses are NEVER returned here — office draft content
 * cannot leak to the public site (req. 16/120).
 */

export async function getPublishedCourses(): Promise<CatalogCourse[]> {
  try {
    await connectDB();

    const [courses, categories] = await Promise.all([
      Course.find({
        status: COURSE_STATUSES.PUBLISHED,
        isDisplayed: true,
      })
        .sort({ sortOrder: 1, updatedAt: -1 })
        .lean(),
      Category.find().select("slug name").lean(),
    ]);

    if (courses.length === 0) {
      // Documented dev fallback — the office portal is the source of truth
      // once any course exists in MongoDB.
      return getCatalogFallbackCourses();
    }

    const categorySlugById = new Map(
      categories.map((c) => [String(c._id), c.slug])
    );

    const courseIds = courses.map((c) => c._id);
    const [modules, lessons] = await Promise.all([
      Module.find({ course: { $in: courseIds }, isPublished: true })
        .sort({ sortOrder: 1 })
        .lean(),
      Lesson.find({
        course: { $in: courseIds },
        isPublished: true,
      })
        .sort({ sortOrder: 1 })
        .select("course module slug title durationMinutes isPreview")
        .lean(),
    ]);

    return courses.map((course) => {
      const courseModules = modules.filter(
        (m) => String(m.course) === String(course._id)
      );
      const syllabus: CatalogModule[] = courseModules.map((module) => ({
        slug: String(module._id),
        title: module.title,
        description: module.description ?? undefined,
        lessons: lessons
          .filter((l) => String(l.module) === String(module._id))
          .map((l) => ({
            slug: String(l._id),
            title: l.title,
            durationMinutes: l.durationMinutes ?? undefined,
            isPreview: l.isPreview,
          })),
      }));

      return {
        slug: course.slug,
        _id: String(course._id),
        name: course.name,
        categorySlug: categorySlugById.get(String(course.category)) ?? "",
        shortDescription: course.shortDescription ?? "",
        description: course.description ?? "",
        level: course.level,
        status: course.status as CourseStatus,
        durationWeeks: course.durationWeeks ?? 0,
        durationBucket:
          (course.durationWeeks ?? 0) <= 8
            ? "short"
            : (course.durationWeeks ?? 0) <= 16
              ? "medium"
              : "long",
        price: course.isFree ? 0 : (course.price ?? 0),
        compareAtPrice: course.compareAtPrice,
        isFree: course.isFree,
        isPurchasable: course.isPurchasable,
        tags: course.tags ?? [],
        learningMode: course.learningMode ?? "online",
        thumbnailUrl: course.thumbnailUrl,
        featured: false,
        syllabus,
        learningOutcomes: course.learningOutcomes ?? [],
        requirements: course.requirements ?? [],
        targetAudience: course.targetAudience ?? [],
        instructor: course.instructorName
          ? {
              id: "course-instructor",
              name: course.instructorName,
              designation: "",
              bio: "",
              expertise: [],
            }
          : undefined,
        faqs: (course.faqs ?? [])
          .filter((faq) => faq.enabled)
          .map((faq) => ({ question: faq.question, answer: faq.answer })),
        learningFeatures: [],
      } satisfies CatalogCourse;
    });
  } catch (error) {
    console.error("Public course query failed; using catalog fallback:", error);
    return getCatalogFallbackCourses();
  }
}

export async function getPublishedCourseBySlug(
  slug: string
): Promise<CatalogCourse | undefined> {
  const courses = await getPublishedCourses();
  return courses.find((course) => course.slug === slug);
}
