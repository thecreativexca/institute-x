"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { Filter, X, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

interface SupportFiltersProps {
  initialFilters: {
    search?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedToMe?: boolean;
    unassigned?: boolean;
    courseId?: string;
  };
  initialSort: {
    field: string;
    direction: "asc" | "desc";
  };
  courses: { id: string; name: string }[];
}

export function SupportFilters({ initialFilters, initialSort, courses }: SupportFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState(initialFilters.search ?? "");
  const [status, setStatus] = useState(initialFilters.status ?? "all");
  const [priority, setPriority] = useState(initialFilters.priority ?? "all");
  const [category, setCategory] = useState(initialFilters.category ?? "all");
  const [courseId, setCourseId] = useState(initialFilters.courseId ?? "all");
  const [assignedToMe, setAssignedToMe] = useState(initialFilters.assignedToMe ?? false);
  const [unassigned, setUnassigned] = useState(initialFilters.unassigned ?? false);
  const [sort, setSort] = useState(`${initialSort.field},${initialSort.direction}`);

  const hasActiveFilters = Object.values(initialFilters).some(
    (v) => v !== undefined && v !== "" && v !== "all" && v !== false
  );

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all" || value === "false") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    params.delete("page");
    return `/office/support?${params.toString()}`;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const [sortField, sortDirection] = sort.split(",");
    router.push(
      buildUrl({
        search: search.trim() || undefined,
        status,
        priority,
        category,
        courseId,
        assignedToMe: assignedToMe ? "true" : undefined,
        unassigned: unassigned ? "true" : undefined,
        sort: sortField,
        direction: sortDirection,
      })
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPriority("all");
    setCategory("all");
    setCourseId("all");
    setAssignedToMe(false);
    setUnassigned(false);
    setSort("lastMessageAt,desc");
    router.push("/office/support");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Top bar: search + toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            id="search"
            name="search"
            placeholder="Search tickets, students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-white border-slate-200 text-sm placeholder:text-slate-400 focus-visible:ring-primary-400"
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear filters
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50",
              isExpanded && "border-primary-300 bg-primary-50 text-primary-700"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {Object.values(initialFilters).filter((v) => v !== undefined && v !== "" && v !== "all" && v !== false).length}
              </span>
            )}
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform duration-200", isExpanded && "rotate-180")}
              aria-hidden="true"
            />
          </Button>
          <Button type="submit" size="sm" className="h-9 gap-2 rounded-lg px-4">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Apply
          </Button>
        </div>
      </div>

      {/* Expanded filters */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div>
              <label htmlFor="status" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" className="h-9 bg-white text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="waiting_for_student">Waiting for Student</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Priority
              </label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority" className="h-9 bg-white text-sm">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-9 bg-white text-sm">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="course_access">Course Access</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="assignment">Assignment</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sort by
              </label>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger id="sort" className="h-9 bg-white text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastMessageAt,desc">Last activity (newest)</SelectItem>
                  <SelectItem value="createdAt,desc">Created (newest)</SelectItem>
                  <SelectItem value="createdAt,asc">Created (oldest)</SelectItem>
                  <SelectItem value="priority,desc">Priority (highest)</SelectItem>
                  <SelectItem value="status,asc">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Course */}
            {courses.length > 0 && (
              <div>
                <label htmlFor="course" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Course
                </label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger id="course" className="h-9 bg-white text-sm">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Toggle checkboxes */}
            <div className="flex flex-col gap-3 justify-center">
              <label className="flex cursor-pointer items-center gap-2.5">
                <div
                  className={cn(
                    "relative h-4 w-4 flex-shrink-0 rounded border-2 transition-colors",
                    assignedToMe ? "border-primary-600 bg-primary-600" : "border-slate-300 bg-white"
                  )}
                >
                  {assignedToMe && (
                    <svg className="absolute inset-0 h-full w-full p-0.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={assignedToMe}
                    onChange={(e) => {
                      setAssignedToMe(e.target.checked);
                      if (e.target.checked) setUnassigned(false);
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">Assigned to me</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5">
                <div
                  className={cn(
                    "relative h-4 w-4 flex-shrink-0 rounded border-2 transition-colors",
                    unassigned ? "border-primary-600 bg-primary-600" : "border-slate-300 bg-white"
                  )}
                >
                  {unassigned && (
                    <svg className="absolute inset-0 h-full w-full p-0.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={unassigned}
                    onChange={(e) => {
                      setUnassigned(e.target.checked);
                      if (e.target.checked) setAssignedToMe(false);
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700">Unassigned only</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
