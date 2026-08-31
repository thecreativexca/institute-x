import { BookOpen } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import type { StudentResourceView } from "@/lib/resources/queries";
import { ResourceCard } from "./resource-card";

export interface LessonResourcesProps {
  resources: StudentResourceView[] | null;
  /** True when the resource query itself failed (distinct from "empty"). */
  hasError?: boolean;
  /** Used by the Try Again action after a load failure. */
  retryHref?: string;
}

/**
 * Learning Resources section for a lesson.
 * Rendered server-side from the lesson page — no client JS needed.
 */
export function LessonResources({
  resources,
  hasError = false,
  retryHref,
}: LessonResourcesProps) {
  return (
    <section aria-labelledby="learning-resources-heading" className="space-y-4 rounded-2xl border border-primary-100 bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100">
          <BookOpen className="h-5 w-5 text-accent-800" aria-hidden="true" />
        </span>
        <h2 id="learning-resources-heading" className="text-xl font-semibold text-slate-900">
          Learning Resources
        </h2>
      </div>

      {hasError ? (
        <ErrorState
          title="Unable to open this resource."
          description="The learning resources for this lesson could not be loaded."
          action={
            retryHref ? (
              <a
                href={retryHref}
                className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Try Again
              </a>
            ) : undefined
          }
        />
      ) : !resources || resources.length === 0 ? (
        <p className="rounded-xl border border-dashed border-primary-200 bg-primary-50/60 px-6 py-8 text-center text-sm text-slate-500">
          No learning resources have been added for this lesson yet.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {resources.map((resource) => (
            <li key={resource._id.toString()}>
              <ResourceCard resource={resource} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
