"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { getActiveFilterLabels, COURSE_FILTER_PARAMS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface ActiveFilterChipsProps {
  /** Current filter values */
  filters: {
    search?: string;
    category?: string;
    level?: string;
    duration?: string;
    sort?: string;
  };
  /** Additional CSS classes */
  className?: string;
}

/**
 * Displays active filter chips with remove buttons.
 */
export function ActiveFilterChips({ filters, className }: ActiveFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeLabels = getActiveFilterLabels(filters);

  if (activeLabels.length === 0) return null;

  const removeFilter = (param: keyof typeof COURSE_FILTER_PARAMS) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(COURSE_FILTER_PARAMS[param]);
    router.push(`/courses?${params.toString()}`, { scroll: false });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} role="group" aria-label="Active filters">
      <span className="text-xs font-medium text-slate-500">Active filters:</span>
      {activeLabels.map(({ label, param, value }) => (
        <span
          key={`${param}-${value}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-sm font-medium text-primary-800"
        >
          {label}
          <button
            type="button"
            onClick={() => removeFilter(param)}
            className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-primary-700 hover:bg-primary-100 transition-colors"
            aria-label={`Remove ${label}`}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}