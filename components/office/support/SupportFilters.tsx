"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { Filter, X, ChevronDown } from "lucide-react";

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

export function SupportFilters({
  initialFilters,
  initialSort,
  courses,
}: SupportFiltersProps) {
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

  const hasActiveFilters = Object.values(initialFilters).some((v) => v !== undefined && v !== "" && v !== "all" && v !== false);

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
    router.push(buildUrl({
      search: search.trim() || undefined,
      status,
      priority,
      category,
      courseId,
      assignedToMe: assignedToMe ? "true" : undefined,
      unassigned: unassigned ? "true" : undefined,
      sort: sortField,
      direction: sortDirection,
    }));
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <span className="font-medium text-slate-900">Filters</span>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1 text-slate-600 hover:text-slate-900"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
          {isExpanded ? "Less" : "More"}
        </Button>
      </div>

      <div className={cn("space-y-4 transition-all duration-200", isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden")}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">
              Search
            </label>
            <Input
              id="search"
              name="search"
              placeholder="Search tickets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_for_student">Waiting for Student</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger id="priority">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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

          <div>
            <label htmlFor="course" className="block text-sm font-medium text-slate-700 mb-1">
              Course
            </label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger id="course">
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

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={assignedToMe}
                onChange={(event) => {
                  setAssignedToMe(event.target.checked);
                  if (event.target.checked) setUnassigned(false);
                }}
              />
              <span className="text-sm text-slate-700">Assigned to me</span>
            </label>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={unassigned}
                onChange={(event) => {
                  setUnassigned(event.target.checked);
                  if (event.target.checked) setAssignedToMe(false);
                }}
              />
              <span className="text-sm text-slate-700">Unassigned</span>
            </label>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-slate-700 mb-1">
              Sort by
            </label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger id="sort">
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

        <div className="flex justify-end pt-2 border-t border-slate-200">
          <Button type="submit" className="gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Apply Filters
          </Button>
        </div>
      </div>
    </form>
  );
}
