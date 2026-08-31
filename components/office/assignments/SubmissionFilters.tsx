"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";
import { Filter, X, ChevronDown } from "lucide-react";
import { useState } from "react";

interface SubmissionFiltersProps {
  initialFilters: {
    search?: string;
    status?: string;
  };
  initialSort: {
    field: string;
    direction: "asc" | "desc";
  };
}

export function SubmissionFilters({
  initialFilters,
  initialSort,
}: SubmissionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(initialFilters).some((v) => v !== undefined && v !== "" && v !== "all");

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
    return `${window.location.pathname}?${params.toString()}`;
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
    router.push(window.location.pathname);
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
              Search Student
            </label>
            <Input
              id="search"
              name="search"
              placeholder="Search by name or email..."
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
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="late">Late</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="submittedAt,desc">Submitted (newest)</SelectItem>
                <SelectItem value="submittedAt,asc">Submitted (oldest)</SelectItem>
                <SelectItem value="studentName,asc">Student Name A–Z</SelectItem>
                <SelectItem value="status,asc">Status</SelectItem>
                <SelectItem value="score,desc">Score (highest)</SelectItem>
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