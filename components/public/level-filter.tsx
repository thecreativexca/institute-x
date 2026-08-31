"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { COURSE_LEVEL_OPTIONS, COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface LevelFilterProps {
  /** Current active level */
  activeLevel: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Level filter as dropdown select.
 */
export function LevelFilter({ activeLevel, className }: LevelFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());

    if (event.target.value && event.target.value !== "all_levels") {
      params.set(COURSE_FILTER_PARAMS.level, event.target.value);
    } else {
      params.delete(COURSE_FILTER_PARAMS.level);
    }

    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  return (
    <label htmlFor="level-filter" className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium text-slate-500">Level</span>
      <select
        id="level-filter"
        value={activeLevel}
        onChange={handleChange}
        className="h-10 px-3 pr-10 text-sm border border-slate-300 bg-white rounded-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary-600/40 focus:border-transparent cursor-pointer"
        aria-label="Filter by course level"
      >
        {COURSE_LEVEL_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}