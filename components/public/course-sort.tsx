"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { COURSE_SORT_OPTIONS, type CourseSortOption, COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface CourseSortProps {
  /** Current active sort option */
  activeSort: CourseSortOption;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Sort control as dropdown select.
 */
export function CourseSort({ activeSort, className }: CourseSortProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (event.target.value && event.target.value !== "recommended") {
      params.set(COURSE_FILTER_PARAMS.sort, event.target.value);
    } else {
      params.delete(COURSE_FILTER_PARAMS.sort);
    }

    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  return (
    <label htmlFor="sort-filter" className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-slate-500">Sort by</span>
      <select
        id="sort-filter"
        value={activeSort}
        onChange={handleChange}
        className="h-10 px-3 pr-10 text-sm border border-slate-300 bg-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-transparent cursor-pointer"
        aria-label="Sort courses"
      >
        {COURSE_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}