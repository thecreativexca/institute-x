"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";

interface CourseEmptyStateProps {
  /** Whether a search was performed */
  hasSearch: boolean;
  /** Current search query */
  searchQuery?: string;
  /** Whether any filters are active */
  hasFilters: boolean;
  /** Callback to clear all filters */
  onClearFilters: () => void;
}

/**
 * Empty state shown when no courses match the current filters.
 */
export function CourseEmptyState({ hasSearch, searchQuery, hasFilters, onClearFilters }: CourseEmptyStateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(COURSE_FILTER_PARAMS.search);
    params.delete(COURSE_FILTER_PARAMS.category);
    params.delete(COURSE_FILTER_PARAMS.level);
    params.delete(COURSE_FILTER_PARAMS.duration);
    params.delete(COURSE_FILTER_PARAMS.sort);
    router.push(`/courses?${params.toString()}`);
    onClearFilters();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-4 text-center">
      <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-10 w-10 text-slate-400"
        >
          <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-slate-900">
          {hasSearch ? "No courses found" : "No courses available"}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {hasSearch
            ? `We couldn't find any courses matching "${searchQuery}". Try adjusting your search or filters.`
            : "There are no courses available at the moment. Please check back later."}
        </p>
      </div>

      {(hasSearch || hasFilters) && (
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={handleClearAll}
            className={buttonVariants("outline", "md", "w-full sm:w-auto")}
          >
            Clear All Filters
          </button>
          <Link
            href="/courses"
            className={buttonVariants("primary", "md", "w-full sm:w-auto")}
          >
            View All Courses
          </Link>
        </div>
      )}
    </div>
  );
}