"use client";

import { useCallback, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface CourseSearchProps {
  /** Current search value */
  value: string;
  /** Placeholder text */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Course search input with URL sync.
 * Updates the `search` query parameter on change.
 */
export function CourseSearch({ value, placeholder = "Search courses...", className }: CourseSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      const params = new URLSearchParams(searchParams.toString());

      if (newValue.trim()) {
        params.set(COURSE_FILTER_PARAMS.search, newValue.trim());
      } else {
        params.delete(COURSE_FILTER_PARAMS.search);
      }

      router.push(`/courses?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleClear = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(COURSE_FILTER_PARAMS.search);
    router.push(`/courses?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor="course-search" className="sr-only">
        Search courses
      </label>
      <input
        id="course-search"
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-primary-200 bg-primary-50/35 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        autoComplete="off"
      />
      <svg
        aria-hidden="true"
        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Clear search"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
