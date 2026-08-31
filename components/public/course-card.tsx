import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CourseSummary } from "@/types/course";

const levelLabels: Record<CourseSummary["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All levels",
};

export interface CourseCardProps {
  course: CourseSummary;
  /** Optional variant for different display contexts */
  variant?: "default" | "compact";
}

/**
 * Reusable course card used on the home page and (in later phases) the
 * courses listing and dashboards.
 */
export function CourseCard({ course, variant = "default" }: CourseCardProps) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-primary-100 bg-white transition-all hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover">
      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-accent-50 text-primary-300">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-12 w-12"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col gap-2 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          {course.categoryName ? (
            <Badge variant="primary">{course.categoryName}</Badge>
          ) : null}
          <Badge variant="neutral">{levelLabels[course.level]}</Badge>
        </div>
        <h3 className="text-base font-semibold leading-snug text-primary-950">
          {course.name}
        </h3>
        {course.shortDescription ? (
          <p className="text-sm leading-relaxed text-slate-600">
            {course.shortDescription}
          </p>
        ) : null}
        {variant === "default" && (
          <div className="mt-auto flex flex-col gap-2 border-t border-primary-100 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              {course.durationWeeks ? (
                <span className="flex items-center gap-1">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  {course.durationWeeks} weeks
                </span>
              ) : null}
              {course.price !== undefined && course.price !== null && (
                <span className={course.price === 0 ? "font-semibold text-emerald-700" : "font-medium text-slate-900"}>
                  {course.price === 0 ? "Free" : `₹${course.price.toLocaleString("en-IN")}`}
                </span>
              )}
            </div>
            <Link href={`/courses/${course.slug}`} className={buttonVariants("outline", "sm", "w-full border-primary-200 text-primary-800 hover:border-primary-300 hover:bg-primary-50")}>
              View Course
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
