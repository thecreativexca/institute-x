"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MobileFilterDrawer } from "@/components/public/mobile-filter-drawer";
import { cn } from "@/lib/utils/cn";

interface MobileFilterTriggerProps {
  /** Current filter values from URL */
  filters: {
    search?: string;
    category: string;
    level: string;
    duration: string;
  };
}

/**
 * Mobile filter trigger button and drawer.
 * Only renders on mobile (lg:hidden).
 */
export function MobileFilterTrigger({ filters }: MobileFilterTriggerProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFiltersChange = (newFilters: { category: string; level: string; duration: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newFilters.category) {
      params.set("category", newFilters.category);
    } else {
      params.delete("category");
    }

    if (newFilters.level && newFilters.level !== "all_levels") {
      params.set("level", newFilters.level);
    } else {
      params.delete("level");
    }

    if (newFilters.duration) {
      params.set("duration", newFilters.duration);
    } else {
      params.delete("duration");
    }

    router.push(`/courses?${params.toString()}`, { scroll: false });
    setDrawerOpen(false);
  };

  const handleClose = () => {
    setDrawerOpen(false);
  };

  const activeFilterCount = [
    filters.category,
    filters.level !== "all_levels" ? filters.level : null,
    filters.duration,
  ].filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 h-10 px-4 rounded-md border font-medium text-sm lg:hidden",
          activeFilterCount > 0
            ? "bg-primary-600 border-primary-600 text-white"
            : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
        )}
        aria-label={`Open filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
          <path d="M3 3h18M3 12h18M3 21h18" strokeLinecap="round" />
        </svg>
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-white text-xs font-semibold">
            {activeFilterCount}
          </span>
        )}
      </button>

      <MobileFilterDrawer
        open={drawerOpen}
        onClose={handleClose}
        filters={{ category: filters.category, level: filters.level, duration: filters.duration }}
        onFiltersChange={handleFiltersChange}
      />
    </>
  );
}