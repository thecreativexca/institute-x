import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Headphones,
  PhoneCall,
  Sparkles,
} from "lucide-react";

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
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Career Courses & Professional Diplomas",
  description:
    "Explore Creative X Tycoon institute courses across web programming, Tally accounting, graphic design, basic office skills, and communication.",
  openGraph: {
    title: "Courses & Programs | Creative X Tycoon Institute",
    description:
      "Choose from practical, job-oriented courses designed with dedicated lab sessions and verified certification.",
    type: "website",
  },
};

/**
 * Courses page — Premier institute prospectus view with active filtering,
 * thematic image cards, academic counseling, and student guarantees.
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
          { label: "Course Catalog", href: "/courses", current: true },
        ]}
        className="mb-6"
      />

      {/* Page Header — Institute Catalog Banner */}
      <header className="public-hero-pattern relative mb-8 overflow-hidden rounded-[2rem] border border-primary-200 bg-gradient-to-r from-primary-950 via-primary-900 to-primary-950 p-7 text-white shadow-card-hover sm:p-10 lg:p-12">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-20" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div className="max-w-3xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-400/40 bg-accent-400/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-300">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Institute Academic Catalog
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white">
                {activeCategory ? `${activeCategory.name} Programs` : "Professional Courses & Diplomas"}
              </h1>
              <p className="mt-3 text-base sm:text-lg leading-relaxed text-primary-100/90">
                {activeCategory
                  ? activeCategory.description
                  : "Industry-aligned, lab-intensive training programs structured to turn enthusiastic learners into job-ready professionals."}
              </p>

              {/* Institute Quick Badges */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-accent-200">
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  100% Practical Lab Training
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Award className="h-4 w-4 text-accent-300" aria-hidden="true" />
                  Govt & ISO Standard Curriculum
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Calendar className="h-4 w-4 text-primary-200" aria-hidden="true" />
                  Morning, Evening & Weekend Batches
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col sm:flex-row gap-3">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-300 px-6 text-sm font-bold text-primary-950 shadow-md transition-colors hover:bg-accent-400"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                Free Course Counseling
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Institute Guarantee Strip */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white p-3.5 shadow-sm">
          <BookOpen className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-bold text-primary-950">Free Demo Class</p>
            <p className="text-slate-500">Attend before enrolling</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white p-3.5 shadow-sm">
          <Award className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-bold text-primary-950">Verified Certificate</p>
            <p className="text-slate-500">QR-code authenticity</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white p-3.5 shadow-sm">
          <Headphones className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-bold text-primary-950">1-on-1 Mentor Support</p>
            <p className="text-slate-500">Daily doubt clearing</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-primary-100 bg-white p-3.5 shadow-sm">
          <Calendar className="h-5 w-5 text-primary-700 shrink-0" aria-hidden="true" />
          <div className="text-xs">
            <p className="font-bold text-primary-950">Flexible Batches</p>
            <p className="text-slate-500">Online & campus center</p>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilterChips filters={filters} className="mb-4" />

      {/* Search and Filters Bar */}
      <div className="mb-8 rounded-2xl border border-primary-100 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 w-full">
          <CourseSearch value={filters.search} placeholder="Search courses by name, software, or skill (e.g., Python, Tally, Excel, Web Design)..." />
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
      <div className="mb-6 flex items-center justify-between text-sm text-slate-600">
        <span>
          Showing <span className="font-bold text-primary-950">{sortedCourses.length}</span> of{" "}
          <span className="font-bold text-primary-950">{publishedCourses.length}</span> programs available
        </span>
        {activeCategory && (
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            Category: {activeCategory.name}
          </span>
        )}
      </div>

      {/* Course Grid with Rich Thumbnails */}
      {sortedCourses.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
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

      {/* Bottom Academic Assistance Card */}
      <div className="mt-16 rounded-[2rem] border border-primary-200 bg-gradient-to-br from-primary-50 to-accent-100/50 p-8 sm:p-10 text-center">
        <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary-800">
          Personalized Career Guidance
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-primary-950">
          Not Sure Which Course Aligns With Your Career Goal?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
          Our senior academic counselors analyze your educational background, interests, and target industry to recommend the most optimal diploma or certification.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={siteConfig.contact.phoneHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-primary-950 transition-colors"
          >
            <PhoneCall className="h-4 w-4" aria-hidden="true" />
            Call Admission Desk ({siteConfig.contact.phone})
          </a>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-primary-300 bg-white px-6 py-3 text-sm font-bold text-primary-950 hover:bg-primary-50 transition-colors"
          >
            Request Free Callback
          </Link>
        </div>
      </div>
    </Container>
  );
}
