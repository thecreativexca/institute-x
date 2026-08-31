"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

  const hasActiveFilters = Object.values(initialFilters).some((v) => v !== undefined && v !== "" && v !== "all" && v !== false);

  const buildUrl = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") {
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
    const formData = new FormData(e.currentTarget);
    const updates: Record<string, string | undefined> = {};
    formData.forEach((value, key) => {
      if (value) updates[key] = value.toString();
    });
    router.push(buildUrl(updates));
  };

  const clearFilters = () => {
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
              value={initialFilters.search || ""}
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
              Status
            </label>
            <Select value={initialFilters.status || "all"} onValueChange={(value) => {}}>
              <SelectTrigger id="status" name="status">
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
            <Select value={initialFilters.priority || "all"} onValueChange={(value) => {}}>
              <SelectTrigger id="priority" name="priority">
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
            <Select value={initialFilters.category || "all"} onValueChange={(value) => {}}>
              <SelectTrigger id="category" name="category">
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
            <Select value={initialFilters.courseId || "all"} onValueChange={(value) => {}}>
              <SelectTrigger id="course" name="courseId">
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
                name="assignedToMe"
                checked={initialFilters.assignedToMe || false}
              />
              <span className="text-sm text-slate-700">Assigned to me</span>
            </label>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="unassigned"
                checked={initialFilters.unassigned || false}
              />
              <span className="text-sm text-slate-700">Unassigned</span>
            </label>
          </div>

          <div>
            <label htmlFor="sort" className="block text-sm font-medium text-slate-700 mb-1">
              Sort by
            </label>
            <Select value={`${initialSort.field},${initialSort.direction}`} onValueChange={(value) => {}}>
              <SelectTrigger id="sort" name="sort">
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