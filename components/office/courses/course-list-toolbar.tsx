"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { FieldShell, controlClassName } from "@/components/ui/field";

interface CategoryOption {
  id: string;
  name: string;
}

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "recently_updated", label: "Recently updated" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "name_a_z", label: "Name A–Z" },
  { value: "name_z_a", label: "Name Z–A" },
];

const LEVEL_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All levels (course)" },
];

const PRICING_OPTIONS = [
  { value: "ALL", label: "Free & paid" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

/**
 * Course list toolbar (req. 7–9): server-side search/filter/sort — every
 * change updates the URL query so the server component re-queries MongoDB.
 */
export function CourseListToolbar({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set(key, value);
    else params.delete(key);
    params.delete("page"); // filter change resets pagination
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    updateParam("search", search.trim());
  }

  const selectClass = controlClassName(false, "h-10 pr-8");

  return (
    <div className="space-y-4" aria-busy={isPending}>
      <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row" role="search">
        <div className="flex-1">
          <label htmlFor="course-search" className="sr-only">
            Search courses
          </label>
          <input
            id="course-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title, slug or tag…"
            className={controlClassName(false)}
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FieldShell label="Status" id="filter-status">
          <select
            id="filter-status"
            className={selectClass}
            value={searchParams.get("status") ?? "ALL"}
            onChange={(event) => updateParam("status", event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Category" id="filter-category">
          <select
            id="filter-category"
            className={selectClass}
            value={searchParams.get("categoryId") ?? ""}
            onChange={(event) => updateParam("categoryId", event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Level" id="filter-level">
          <select
            id="filter-level"
            className={selectClass}
            value={searchParams.get("level") ?? ""}
            onChange={(event) => updateParam("level", event.target.value)}
          >
            {LEVEL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>

        <FieldShell label="Sort" id="filter-sort">
          <select
            id="filter-sort"
            className={selectClass}
            value={searchParams.get("sort") ?? "recently_updated"}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldShell>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Pricing:</span>
        {PRICING_OPTIONS.map((option) => {
          const current = searchParams.get("pricing") ?? "ALL";
          const active = current === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => updateParam("pricing", option.value)}
              aria-pressed={active}
              className={
                active
                  ? "rounded-full bg-primary-600 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
