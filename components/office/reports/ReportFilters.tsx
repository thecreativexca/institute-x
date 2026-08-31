"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { RefreshCw, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

const PRESETS: { key: string; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
  { key: "custom", label: "Custom" },
];

interface ReportFiltersProps {
  courseOptions: { id: string; name: string }[];
  initialPreset: string;
  initialCourse: string | null;
  initialFrom?: string;
  initialTo?: string;
  /** Hide the course filter (e.g. overview). */
  showCourse?: boolean;
}

export function ReportFilters({
  courseOptions,
  initialPreset,
  initialCourse,
  initialFrom,
  initialTo,
  showCourse = true,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");
  const [course, setCourse] = useState(initialCourse ?? "");

  const apply = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const setPreset = (key: string) => {
    if (key === "custom") {
      apply({ range: "custom" });
    } else {
      apply({ range: key, from: null, to: null });
    }
  };

  const submitCustom = () => {
    apply({ range: "custom", from: from || null, to: to || null });
  };

  const applyCourse = (value: string) => {
    setCourse(value);
    apply({ course: value || null });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Date preset">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPreset(p.key)}
            aria-pressed={initialPreset === p.key}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              initialPreset === p.key
                ? "border-primary-300 bg-primary-50 text-primary-800"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showCourse && courseOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="report-course" className="text-xs font-medium text-slate-500">
            Course
          </label>
          <select
            id="report-course"
            value={course}
            onChange={(e) => applyCourse(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-700"
          >
            <option value="">All courses</option>
            {courseOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {initialPreset === "custom" && (
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="report-from" className="mb-1 block text-xs font-medium text-slate-500">
              From
            </label>
            <input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="report-to" className="mb-1 block text-xs font-medium text-slate-500">
              To
            </label>
            <input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={submitCustom}>
            Apply
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <button
          type="button"
          onClick={() => router.refresh()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
        </button>
        <Link
          href={pathname}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
        </Link>
      </div>
    </div>
  );
}