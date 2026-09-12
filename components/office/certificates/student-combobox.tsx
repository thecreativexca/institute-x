"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { controlClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";
import { Search, X, Loader2 } from "lucide-react";
import type { CertificateOption } from "@/lib/office/certificates/dto";

interface StudentComboboxProps {
  /** Chosen student, or null. Owned by the parent form. */
  value: CertificateOption | null;
  onChange: (student: CertificateOption | null) => void;
  error?: string;
}

/**
 * Searchable student picker.
 *
 * Queries the admin-only search endpoint (debounced) rather than loading every
 * student into the browser. The selected option carries the student's `_id`,
 * which is what gets submitted as `studentId` — and which the server validates
 * again before writing anything.
 */
export function StudentCombobox({ value, onChange, error }: StudentComboboxProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<CertificateOption[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search.
  useEffect(() => {
    if (value && query === value.label) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/office/certificates/students?q=${encodeURIComponent(query)}&limit=10`,
          { cache: "no-store" }
        );
        const payload = (await response.json()) as {
          success: boolean;
          students?: CertificateOption[];
        };
        if (!cancelled && payload.success) setOptions(payload.students ?? []);
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, value]);

  // Close the dropdown on an outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = useCallback(
    (student: CertificateOption) => {
      onChange(student);
      setQuery(student.label);
      setOpen(false);
    },
    [onChange]
  );

  const clear = useCallback(() => {
    onChange(null);
    setQuery("");
    setOptions([]);
  }, [onChange]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="student-combobox-listbox"
          aria-autocomplete="list"
          aria-label="Search for a student"
          placeholder="Search by student name, email or phone…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          className={controlClassName(Boolean(error), "h-10 pl-10 pr-10")}
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400"
            aria-hidden="true"
          />
        ) : value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear selected student"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {value ? (
        <p className="mt-1.5 text-xs text-amber-800">
          Selected: <span className="font-medium">{value.label}</span>
          {value.hint ? ` · ${value.hint}` : ""}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">
          The certificate is issued to the student you select here.
        </p>
      )}

      {open && !value ? (
        <ul
          id="student-combobox-listbox"
          role="listbox"
          className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-500">
              {loading ? "Searching…" : "No students match that search."}
            </li>
          ) : (
            options.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => select(student)}
                  className={cn(
                    "flex w-full flex-col items-start px-3 py-2 text-left hover:bg-primary-50"
                  )}
                >
                  <span className="text-sm font-medium text-slate-900">
                    {student.label}
                  </span>
                  {student.hint ? (
                    <span className="text-xs text-slate-500">{student.hint}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
