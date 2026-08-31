"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { COURSE_CATEGORY_OPTIONS, COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface CategoryFilterProps {
  /** Current active category slug */
  activeCategory: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Category filter as horizontal scrollable tabs (desktop) or dropdown (mobile).
 */
export function CategoryFilter({ activeCategory, className }: CategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (categorySlug) {
      params.set(COURSE_FILTER_PARAMS.category, categorySlug);
    } else {
      params.delete(COURSE_FILTER_PARAMS.category);
    }

    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      className={cn("flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}
      role="group"
      aria-label="Course categories"
    >
      {COURSE_CATEGORY_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => handleChange(option.value)}
          aria-pressed={activeCategory === option.value}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
            activeCategory === option.value
              ? "bg-primary-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}