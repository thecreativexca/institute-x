import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, MessageCircleMore, SlidersHorizontal } from "lucide-react";

import { ActiveFilterChips } from "@/components/public/active-filter-chips";
import { CategoryFilter } from "@/components/public/category-filter";
import { CourseCard } from "@/components/public/course-card";
import { CourseEmptyState } from "@/components/public/course-empty-state";
import { CourseSearch } from "@/components/public/course-search";
import { CourseSort } from "@/components/public/course-sort";
import { DurationFilter } from "@/components/public/duration-filter";
import { LevelFilter } from "@/components/public/level-filter";
import { MobileFilterTrigger } from "@/components/public/mobile-filter-trigger";
import { Container } from "@/components/ui/container";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { filterCourses, getCategoryBySlug, parseFilterParams, sortCourses, toCourseSummary } from "@/lib/config/course-filters";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses & Professional Skill Programs",
  description: "Explore practical programs in technology, design, business and professional skills. Compare syllabus, duration, level and fee before enrolling.",
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ search?: string; category?: string; level?: string; duration?: string; sort?: string }> }) {
  const filters = parseFilterParams(await searchParams);
  const publishedCourses = await getPublishedCourses();
  const sortedCourses = sortCourses(filterCourses(publishedCourses, filters), filters.sort);
  const activeCategory = filters.category ? getCategoryBySlug(filters.category) : null;

  return (
    <>
      <section className="catalog-hero-v2">
        <Container>
          <div className="catalog-hero-v2-grid">
            <div data-reveal>
              <span className="catalog-hero-v2-kicker"><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Course library</span>
              <h1>{activeCategory ? <>{activeCategory.name}<em> programs.</em></> : <>Find the skill that moves you <em>forward.</em></>}</h1>
              <p>{activeCategory?.description ?? "Search practical programs, compare every syllabus and choose with confidence. No hidden curriculum and no confusing admission flow."}</p>
              <div className="catalog-hero-v2-contact">
                <MessageCircleMore className="h-5 w-5" aria-hidden="true" />
                <span>Not sure where to start?</span>
                <Link href="/contact">Ask our team <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>

            <div className="catalog-hero-v2-search" data-reveal>
              <span>Search the complete catalog</span>
              <CourseSearch value={filters.search} placeholder="Course, software or skill…" variant="hero" />
              <div>
                <p><strong>{publishedCourses.length}</strong> published courses</p>
                <p>Admissions: <a href={siteConfig.contact.phoneHref}>{siteConfig.contact.phone}</a></p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="catalog-v2">
        <Container>
          <div className="catalog-v2-heading">
            <div>
              <span>Explore programs</span>
              <h2>{activeCategory?.name ?? "All courses"}</h2>
            </div>
            <div className="catalog-v2-heading-actions">
              <p><strong>{sortedCourses.length}</strong> results</p>
              <MobileFilterTrigger filters={filters} />
            </div>
          </div>

          <div className="catalog-v2-controls" aria-label="Course filters">
            <div className="catalog-v2-category-wrap">
              <div className="catalog-v2-filter-label"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter by category</div>
              <CategoryFilter activeCategory={filters.category} className="catalog-v2-categories" />
            </div>
            <div className="catalog-v2-selects">
              <LevelFilter activeLevel={filters.level} className="catalog-filter-select" />
              <DurationFilter activeDuration={filters.duration} className="catalog-filter-select" />
              <CourseSort activeSort={filters.sort} className="catalog-filter-select" />
            </div>
          </div>

          <ActiveFilterChips filters={filters} className="catalog-v2-active" />

          {sortedCourses.length ? (
            <ul className="catalog-grid-v2" role="list">
              {sortedCourses.map((course, index) => <li key={course.slug}><CourseCard course={toCourseSummary(course)} index={index} /></li>)}
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
      </section>
    </>
  );
}
