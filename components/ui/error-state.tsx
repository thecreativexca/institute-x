"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  /** When provided, renders a retry button calling this callback. */
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

/** Friendly failure state so the UI never looks broken when data is unavailable. */
export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this content right now. Please try again.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-6 py-14 text-center",
        className
      )}
    >
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="max-w-md text-sm leading-relaxed text-red-800/90">{description}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-3 border-red-300 bg-white text-red-800 hover:bg-red-100" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
