"use client";

import { cn } from "@/lib/utils/cn";

export interface FilterTabItem {
  id: string;
  label: string;
  count?: number;
}

interface FilterTabsProps {
  items: FilterTabItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  className?: string;
}

export function FilterTabs({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterTabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 overflow-x-auto rounded-2xl border border-primary-100 bg-white p-1.5 shadow-card",
        className,
      )}
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const selected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm transition-all",
              selected
                ? "bg-primary-700 font-semibold text-white shadow-sm"
                : "font-medium text-primary-800/70 hover:bg-primary-50",
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span
                className={cn(
                  "inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                  selected
                    ? "bg-white/20 text-white"
                    : "bg-primary-100 text-primary-800",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
