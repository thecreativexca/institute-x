import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { CourseCard } from "@/components/public/course-card";
import { CourseSearch } from "@/components/public/course-search";
import { CategoryFilter } from "@/components/public/category-filter";
import { LevelFilter } from "@/components/public/level-filter";
import { DurationFilter } from "@/components/public/duration-filter";
import { CourseSort } from "@/components/public/course-sort";
import { CourseEmptyState } from "@/components/public/course-empty-state";
import { ActiveFilterChips } from "@/components/public/active-filter-chips";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MobileFilterTrigger } from "@/components/public/mobile-filter-trigger";
import {
  filterCourses,
  sortCourses,
  parseFilterParams,
  toCourseSummary,
  getCategoryBySlug,
} from "@/lib/config/course-filters";
import { getPublishedCourses } from "@/lib/catalog/public-courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Explore Creative X Tycoon courses across technology, design, digital skills, communication, and professional development.",
  openGraph: {
    title: "Courses | Creative X Tycoon",
    description:
      "Choose from practical, career-focused courses designed to help you build valuable skills.",
    type: "website",
  },
};

/**
 * Courses page - Server Component that reads URL params and filters/sorts courses.
 * Client Components handle interactive filter UI.
 */
export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    category?: string;
    level?: string;
    duration?: string;
    sort?: string;
  }>;
}) {
  const resolvedParams = await searchParams;
  const filters = parseFilterParams(resolvedParams);

  // Filter and sort courses (MongoDB is authoritative; static fallback in dev)
  const publishedCourses = await getPublishedCourses();
  const filteredCourses = filterCourses(publishedCourses, filters);
  const sortedCourses = sortCourses(filteredCourses, filters.sort);

  // Get active category for display
  const activeCategory = filters.category ? getCategoryBySlug(filters.category) : null;

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses", current: true },
        ]}
        className="mb-6"
      />

      {/* Page Header */}
      <header className="public-hero-pattern relative mb-8 overflow-hidden rounded-[1.75rem] border border-primary-100 p-6 shadow-card sm:p-8 lg:p-10">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-30" />
        <div className="relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="mb-3 inline-flex rounded-full border border-accent-300 bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">Course catalog</span>
            <h1 className="max-w-4xl text-3xl font-bold tracking-[-0.03em] text-primary-950 sm:text-4xl lg:text-5xl">
              {activeCategory ? `${activeCategory.name} Courses` : "Explore Creative X Tycoon Courses"}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              {activeCategory
                ? activeCategory.description
                : "Choose from practical, career-focused courses designed to help you build valuable skills."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-accent-300 px-5 text-sm font-semibold text-primary-950 shadow-sm transition-colors hover:bg-accent-400"
            >
              Need Help Choosing?
            </Link>
          </div>
        </div>

        {activeCategory && (
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
            <span>{sortedCourses.length} {sortedCourses.length === 1 ? "course" : "courses"} in this category</span>
          </div>
        )}
        </div>
      </header>

      {/* Active filter chips */}
      <ActiveFilterChips filters={filters} className="mb-4" />

      {/* Search and Filters */}
      <div className="mb-7 rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
        {/* Search bar */}
        <div className="mb-4 w-full">
          <CourseSearch value={filters.search} placeholder="Search courses by name, category, or topic..." />
        </div>

        {/* Desktop filters */}
        <div className="hidden border-t border-primary-100 pt-4 lg:flex lg:items-end lg:gap-4">
          <CategoryFilter activeCategory={filters.category} className="lg:w-1/3" />
          <div className="flex flex-wrap items-end gap-4 lg:w-2/3">
            <LevelFilter activeLevel={filters.level} />
            <DurationFilter activeDuration={filters.duration} />
            <CourseSort activeSort={filters.sort} />
          </div>
        </div>

        {/* Mobile filter trigger */}
        <MobileFilterTrigger filters={filters} />
      </div>

      {/* Course count */}
      <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing <span className="font-semibold text-slate-900">{sortedCourses.length}</span> of{" "}
          <span className="font-semibold text-slate-900">{publishedCourses.length}</span> courses
        </span>
      </div>

      {/* Course Grid */}
      {sortedCourses.length > 0 ? (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
          {sortedCourses.map((course) => (
            <li key={course.slug} className="h-full">
              <CourseCard course={toCourseSummary(course)} />
            </li>
          ))}
        </ul>
      ) : (
        <CourseEmptyState
          hasSearch={!!filters.search?.trim()}
          searchQuery={filters.search}
          hasFilters={!!(filters.category || (filters.level && filters.level !== "all_levels") || filters.duration)}
          onClearFilters={() => {}}
        />
      )}
    </Container>
  );
}
