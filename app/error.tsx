"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Route segment error boundary.
 * Next.js 16 passes `retry` to re-render the failed segment.
 */
export default function SegmentError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 bg-slate-50 px-4 py-16 text-center"
    >
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Something went wrong
      </h1>
      <p className="max-w-md text-base leading-relaxed text-slate-600">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <Button variant="primary" size="md" onClick={retry} className="mt-2">
        Try again
      </Button>
    </div>
  );
}
