"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { controlClassName } from "@/components/ui/field";
import { Search, X } from "lucide-react";

interface StudentFiltersProps {
    initialFilters: {
    search?: string;
    status?: "active" | "inactive" | "suspended" | "ALL";
    emailVerified?: "verified" | "unverified" | "ALL";
    hasEnrollment?: boolean;
    courseId?: string;
    joinedFrom?: string;
    joinedTo?: string;
  };
  initialSort: {
    field: "createdAt" | "name" | "lastLoginAt" | "enrollmentCount";
    direction: "asc" | "desc";
  };
  courses: Array<{ id: string; name: string }>;
}

export function StudentFilters({
  initialFilters,
  initialSort,
  courses,
}: StudentFiltersProps) {
  const router = useRouter();

  const [search, setSearch] = useState(initialFilters.search || "");
  const [status, setStatus] = useState(initialFilters.status || "ALL");
  const [emailVerified, setEmailVerified] = useState(initialFilters.emailVerified || "ALL");
  const [hasEnrollment, setHasEnrollment] = useState(initialFilters.hasEnrollment || false);
  const [courseId, setCourseId] = useState(initialFilters.courseId || "");
  const [joinedFrom, setJoinedFrom] = useState(initialFilters.joinedFrom || "");
  const [joinedTo, setJoinedTo] = useState(initialFilters.joinedTo || "");
  const [sortField, setSortField] = useState(initialSort.field);
  const [sortDirection, setSortDirection] = useState(initialSort.direction);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const hasActiveFilters =
    !!debouncedSearch ||
    status !== "ALL" ||
    emailVerified !== "ALL" ||
    hasEnrollment ||
    !!courseId ||
    !!joinedFrom ||
    !!joinedTo;

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setEmailVerified("ALL");
    setHasEnrollment(false);
    setCourseId("");
    setJoinedFrom("");
    setJoinedTo("");
  };

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (status !== "ALL") params.set("status", status);
    if (emailVerified !== "ALL") params.set("verified", emailVerified);
    if (hasEnrollment) params.set("enrolled", "true");
    if (courseId) params.set("course", courseId);
    if (joinedFrom) params.set("from", joinedFrom);
    if (joinedTo) params.set("to", joinedTo);
    if (sortField !== "createdAt") params.set("sort", sortField);
    if (sortDirection !== "desc") params.set("dir", sortDirection);
    router.push(`/office/students?${params.toString()}`, { scroll: false });
  }, [debouncedSearch, status, emailVerified, hasEnrollment, courseId, joinedFrom, joinedTo, sortField, sortDirection, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search by name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={controlClassName(false, "pl-10")}
            aria-label="Search students"
          />
        </div>
        <div>
          <label htmlFor="filter-status" className="sr-only">Account status</label>
          <select
            id="filter-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className={controlClassName(false, "w-full sm:w-[150px] h-10")}
          >
                        <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-verified" className="sr-only">Email verification</label>
          <select
            id="filter-verified"
            value={emailVerified}
            onChange={(e) => setEmailVerified(e.target.value as typeof emailVerified)}
            className={controlClassName(false, "w-full sm:w-[150px] h-10")}
          >
                        <option value="ALL">All Emails</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-course" className="sr-only">Filter by course</label>
          <select
            id="filter-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={controlClassName(false, "w-full sm:w-[200px] h-10")}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="has-enrollment"
            checked={hasEnrollment}
            onChange={(e) => setHasEnrollment(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="has-enrollment" className="text-sm text-slate-600">
            Has enrollment
          </label>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="joined-from" className="text-sm text-slate-600">Joined from</label>
          <input
            id="joined-from"
            type="date"
            value={joinedFrom}
            onChange={(e) => setJoinedFrom(e.target.value)}
            className={controlClassName(false, "w-[150px] h-10")}
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="joined-to" className="text-sm text-slate-600">to</label>
          <input
            id="joined-to"
            type="date"
            value={joinedTo}
            onChange={(e) => setJoinedTo(e.target.value)}
            className={controlClassName(false, "w-[150px] h-10")}
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="sort-field" className="text-sm text-slate-600">Sort</label>
          <select
            id="sort-field"
            value={`${sortField}:${sortDirection}`}
            onChange={(e) => {
              const [field, dir] = e.target.value.split(":");
              setSortField(field as typeof sortField);
              setSortDirection(dir as typeof sortDirection);
            }}
            className={controlClassName(false, "w-[190px] h-10")}
          >
            <option value="createdAt:desc">Newest first</option>
            <option value="createdAt:asc">Oldest first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
            <option value="lastLoginAt:desc">Last active</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>Active filters:</span>
          <div className="flex flex-wrap gap-1.5">
            {debouncedSearch && (
              <Badge variant="neutral" className="gap-1">
                Search: {debouncedSearch}
                <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {status !== "ALL" && (
              <Badge variant="neutral" className="gap-1">
                Status: {status}
                <button type="button" aria-label="Clear status filter" onClick={() => setStatus("ALL")} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {emailVerified !== "ALL" && (
              <Badge variant="neutral" className="gap-1">
                Email: {emailVerified}
                <button type="button" aria-label="Clear email filter" onClick={() => setEmailVerified("ALL")} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {hasEnrollment && (
              <Badge variant="neutral" className="gap-1">
                Has enrollment
                <button type="button" aria-label="Clear enrollment filter" onClick={() => setHasEnrollment(false)} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {courseId && (
              <Badge variant="neutral" className="gap-1">
                Course: {courses.find((c) => c.id === courseId)?.name}
                <button type="button" aria-label="Clear course filter" onClick={() => setCourseId("")} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
            {(joinedFrom || joinedTo) && (
              <Badge variant="neutral" className="gap-1">
                Date: {joinedFrom || "…"} – {joinedTo || "…"}
                <button type="button" aria-label="Clear date filter" onClick={() => { setJoinedFrom(""); setJoinedTo(""); }} className="ml-1 hover:text-slate-600">
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
