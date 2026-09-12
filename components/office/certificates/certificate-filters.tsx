"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { controlClassName } from "@/components/ui/field";
import { Search, X } from "lucide-react";

export interface CertificateFilterValues {
  q?: string;
  courseId?: string;
  status?: "ALL" | "issued" | "revoked";
  issuedFrom?: string;
  issuedTo?: string;
  sort?: "issuedAt" | "createdAt" | "certificateNumber" | "studentName";
  direction?: "asc" | "desc";
}

interface CertificateFiltersProps {
  initialFilters: CertificateFilterValues;
  courses: Array<{ id: string; label: string }>;
  /** Where the filters are applied; also used as the base for clearing. */
  basePath: string;
  /** Hides the status control on the revoked-only view, which pins it. */
  hideStatus?: boolean;
}

const SORT_OPTIONS = [
  { value: "issuedAt:desc", label: "Newest issued first" },
  { value: "issuedAt:asc", label: "Oldest issued first" },
  { value: "createdAt:desc", label: "Recently added" },
  { value: "studentName:asc", label: "Student A–Z" },
  { value: "studentName:desc", label: "Student Z–A" },
  { value: "certificateNumber:asc", label: "Certificate no. A–Z" },
] as const;

/**
 * Search + filter controls for the admin certificate list.
 *
 * Filters live in the URL (like the students module) so a filtered view is
 * shareable and survives a refresh. The search box is debounced to keep a
 * keystroke from firing a request per character.
 */
export function CertificateFilters({
  initialFilters,
  courses,
  basePath,
  hideStatus = false,
}: CertificateFiltersProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.q ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [courseId, setCourseId] = useState(initialFilters.courseId ?? "");
  const [status, setStatus] = useState<"ALL" | "issued" | "revoked">(
    initialFilters.status ?? "ALL"
  );
  const [issuedFrom, setIssuedFrom] = useState(initialFilters.issuedFrom ?? "");
  const [issuedTo, setIssuedTo] = useState(initialFilters.issuedTo ?? "");
  const [sort, setSort] = useState(
    `${initialFilters.sort ?? "issuedAt"}:${initialFilters.direction ?? "desc"}`
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (courseId) params.set("courseId", courseId);
    if (!hideStatus && status !== "ALL") params.set("status", status);
    if (issuedFrom) params.set("issuedFrom", issuedFrom);
    if (issuedTo) params.set("issuedTo", issuedTo);
    const [field, dir] = sort.split(":");
    if (field !== "issuedAt") params.set("sort", field);
    if (dir !== "desc") params.set("direction", dir);
    router.push(`${basePath}?${params.toString()}`, { scroll: false });
  }, [
    debouncedSearch,
    courseId,
    status,
    issuedFrom,
    issuedTo,
    sort,
    hideStatus,
    basePath,
    router,
  ]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  const hasActiveFilters =
    !!debouncedSearch ||
    !!courseId ||
    (!hideStatus && status !== "ALL") ||
    !!issuedFrom ||
    !!issuedTo;

  const clearFilters = () => {
    setSearch("");
    setCourseId("");
    setStatus("ALL");
    setIssuedFrom("");
    setIssuedTo("");
    setSort("issuedAt:desc");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search by student name, student ID or certificate number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={controlClassName(false, "pl-10 h-10")}
            aria-label="Search certificates"
          />
        </div>

        <div>
          <label htmlFor="filter-course" className="sr-only">
            Filter by course
          </label>
          <select
            id="filter-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={controlClassName(false, "h-10 w-full sm:w-[220px]")}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        {hideStatus ? null : (
          <div>
            <label htmlFor="filter-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className={controlClassName(false, "h-10 w-full sm:w-[160px]")}
            >
              <option value="ALL">All Statuses</option>
              <option value="issued">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="issued-from" className="text-sm text-slate-600">
            Issue date from
          </label>
          <input
            id="issued-from"
            type="date"
            value={issuedFrom}
            onChange={(e) => setIssuedFrom(e.target.value)}
            className={controlClassName(false, "h-10 w-[160px]")}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="issued-to" className="text-sm text-slate-600">
            to
          </label>
          <input
            id="issued-to"
            type="date"
            value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)}
            className={controlClassName(false, "h-10 w-[160px]")}
          />
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="sort-field" className="text-sm text-slate-600">
            Sort
          </label>
          <select
            id="sort-field"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={controlClassName(false, "h-10 w-full sm:w-[210px]")}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Active filters:</span>
          <div className="flex flex-wrap gap-1.5">
            {debouncedSearch ? (
              <Badge variant="neutral" className="gap-1">
                Search: {debouncedSearch}
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                  className="ml-1 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ) : null}
            {courseId ? (
              <Badge variant="neutral" className="gap-1">
                Course: {courses.find((c) => c.id === courseId)?.label ?? "—"}
                <button
                  type="button"
                  aria-label="Clear course filter"
                  onClick={() => setCourseId("")}
                  className="ml-1 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ) : null}
            {!hideStatus && status !== "ALL" ? (
              <Badge variant="neutral" className="gap-1">
                Status: {status === "issued" ? "Active" : "Revoked"}
                <button
                  type="button"
                  aria-label="Clear status filter"
                  onClick={() => setStatus("ALL")}
                  className="ml-1 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ) : null}
            {issuedFrom || issuedTo ? (
              <Badge variant="neutral" className="gap-1">
                Issued: {issuedFrom || "…"} – {issuedTo || "…"}
                <button
                  type="button"
                  aria-label="Clear date filter"
                  onClick={() => {
                    setIssuedFrom("");
                    setIssuedTo("");
                  }}
                  className="ml-1 hover:text-slate-700"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      ) : null}
    </div>
  );
}
