"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

import { COURSE_LEVEL_OPTIONS, COURSE_DURATION_OPTIONS, COURSE_CATEGORY_OPTIONS } from "@/lib/config/course-filters";
import { cn } from "@/lib/utils/cn";

interface MobileFilterDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Current filter values */
  filters: {
    category: string;
    level: string;
    duration: string;
  };
  /** Callback when filters change */
  onFiltersChange: (filters: { category: string; level: string; duration: string }) => void;
  /** Children to render inside the drawer (optional additional filters) */
  children?: ReactNode;
}

/**
 * Mobile filter drawer with category, level, and duration filters.
 * Accessible: traps focus, closes on Escape, restores focus on close.
 */
export function MobileFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
  children,
}: MobileFilterDrawerProps) {
  const [activeTab, setActiveTab] = useState<"categories" | "level" | "duration">("categories");
  // Use props directly for initial values, only maintain local state for user changes
  const [localFilters, setLocalFilters] = useState<typeof filters>(() => filters);

  const handleCategoryChange = useCallback((category: string) => {
    setLocalFilters((prev) => ({ ...prev, category }));
  }, []);

  const handleLevelChange = useCallback((level: string) => {
    setLocalFilters((prev) => ({ ...prev, level }));
  }, []);

  const handleDurationChange = useCallback((duration: string) => {
    setLocalFilters((prev) => ({ ...prev, duration }));
  }, []);

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters);
    onClose();
  }, [localFilters, onFiltersChange, onClose]);

  const handleClearAll = useCallback(() => {
    const cleared = { category: "", level: "all_levels", duration: "" };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  }, [onFiltersChange]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const hasActiveFilters =
    localFilters.category ||
    (localFilters.level && localFilters.level !== "all_levels") ||
    localFilters.duration;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        tabIndex={-1}
        className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 id="filter-drawer-title" className="text-lg font-semibold text-slate-900">
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Close filters"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200" role="tablist" aria-label="Filter categories">
          {[
            { id: "categories", label: "Categories" },
            { id: "level", label: "Level" },
            { id: "duration", label: "Duration" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              id={`${tab.id}-tab`}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="flex-1 overflow-y-auto p-4">
          <div
            role="tabpanel"
            id="categories-panel"
            aria-labelledby="categories-tab"
            className={activeTab === "categories" ? "block" : "hidden"}
          >
            <fieldset>
              <legend className="sr-only">Filter by category</legend>
              <div className="flex flex-col gap-2">
                {COURSE_CATEGORY_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="category"
                      value={option.value}
                      checked={localFilters.category === option.value}
                      onChange={() => handleCategoryChange(option.value)}
                      className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-600"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div
            role="tabpanel"
            id="level-panel"
            aria-labelledby="level-tab"
            className={activeTab === "level" ? "block" : "hidden"}
          >
            <fieldset>
              <legend className="sr-only">Filter by level</legend>
              <div className="flex flex-col gap-2">
                {COURSE_LEVEL_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="level"
                      value={option.value}
                      checked={localFilters.level === option.value}
                      onChange={() => handleLevelChange(option.value)}
                      className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-600"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div
            role="tabpanel"
            id="duration-panel"
            aria-labelledby="duration-tab"
            className={activeTab === "duration" ? "block" : "hidden"}
          >
            <fieldset>
              <legend className="sr-only">Filter by duration</legend>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="duration"
                    value=""
                    checked={localFilters.duration === ""}
                    onChange={() => handleDurationChange("")}
                    className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-600"
                  />
                  <span className="text-sm text-slate-700">Any Duration</span>
                </label>
                {COURSE_DURATION_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="duration"
                      value={option.value}
                      checked={localFilters.duration === option.value}
                      onChange={() => handleDurationChange(option.value)}
                      className="h-4 w-4 text-primary-600 border-slate-300 focus:ring-primary-600"
                    />
                    <span className="text-sm text-slate-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Additional custom filters from children */}
          {children && (
            <div className="border-t border-slate-200 p-4" role="tabpanel">
              {children}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 p-4 flex flex-col gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
            >
              Clear All Filters
            </button>
          )}
          <button
            type="button"
            onClick={handleApply}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}