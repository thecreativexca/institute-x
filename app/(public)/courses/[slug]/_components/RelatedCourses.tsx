import Link from "next/link";
import Image from "next/image";
import { getCategoryBySlug } from "@/lib/config/course-filters";
import { CATALOG_COURSES } from "@/lib/config/catalog";
import type { CatalogCourse } from "@/lib/config/catalog";

interface RelatedCoursesProps {
  currentCourseSlug: string;
  categorySlug: string;
  tags: string[];
}

function getRelatedCourses(
  currentSlug: string,
  categorySlug: string,
  tags: string[]
): CatalogCourse[] {
  // First priority: same category, excluding current
  const sameCategory = CATALOG_COURSES.filter(
    (c) => c.categorySlug === categorySlug && c.slug !== currentSlug && c.status === "published"
  );

  if (sameCategory.length >= 4) {
    return sameCategory.slice(0, 4);
  }

  // Second priority: matching tags
  const tagMatches = CATALOG_COURSES.filter(
    (c) =>
      c.slug !== currentSlug &&
      c.status === "published" &&
      c.tags.some((tag) => tags.includes(tag))
  );

  const combined = [...sameCategory];
  for (const course of tagMatches) {
    if (!combined.some((c) => c.slug === course.slug)) {
      combined.push(course);
    }
  }

  if (combined.length >= 4) {
    return combined.slice(0, 4);
  }

  // Fallback: other published courses
  const fallback = CATALOG_COURSES.filter(
    (c) => c.slug !== currentSlug && c.status === "published"
  );

  for (const course of fallback) {
    if (!combined.some((c) => c.slug === course.slug)) {
      combined.push(course);
    }
  }

  return combined.slice(0, 4);
}

export function RelatedCourses({ currentCourseSlug, categorySlug, tags }: RelatedCoursesProps) {
  const relatedCourses = getRelatedCourses(currentCourseSlug, categorySlug, tags);

  if (relatedCourses.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-4">You May Also Like</h3>
      <div className="space-y-3">
        {relatedCourses.map((course) => {
          const category = getCategoryBySlug(course.categorySlug);
          return (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="flex items-center gap-3 rounded-xl border border-primary-100 bg-white p-3 transition-colors hover:border-primary-200 hover:bg-primary-50/50"
            >
              <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-surface-inset flex items-center justify-center overflow-hidden">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="h-8 w-8 text-primary-300"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{course.name}</p>
                <p className="text-xs text-slate-500">{category?.name}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
