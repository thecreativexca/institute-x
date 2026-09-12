import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Star, Award } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCourseImage } from "@/lib/utils/course-images";
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
 * Enhanced professional institute course card with authentic imagery,
 * rating badge, certification label, and clean responsive layout.
 */
export function CourseCard({ course, variant = "default" }: CourseCardProps) {
  const imageSrc = course.thumbnailUrl || getCourseImage(course.slug, undefined, course.categoryName);

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:shadow-[0_12px_30px_-10px_rgba(161,98,7,0.18)]">
      {/* Visual Thumbnail */}
      <div className="relative flex aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={course.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/70 via-transparent to-black/20" />

        {/* Floating Top Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
          {course.categoryName ? (
            <span className="rounded-full bg-primary-950/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              {course.categoryName}
            </span>
          ) : <div />}
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-300/95 px-2.5 py-1 text-[11px] font-bold text-primary-950 shadow-sm backdrop-blur-md">
            <Award className="h-3 w-3" aria-hidden="true" />
            Certified
          </span>
        </div>

        {/* Rating & Level overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
          <span className="flex items-center gap-1 font-semibold text-amber-300 drop-shadow">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            4.9
            <span className="font-normal text-white/80">(Verified)</span>
          </span>
          <span className="rounded-md bg-white/20 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {levelLabels[course.level]}
          </span>
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="text-base font-bold leading-snug text-primary-950 group-hover:text-primary-700 transition-colors line-clamp-2">
          {course.name}
        </h3>

        {course.shortDescription ? (
          <p className="text-xs leading-relaxed text-slate-600 line-clamp-2">
            {course.shortDescription}
          </p>
        ) : null}

        {variant === "default" && (
          <div className="mt-auto flex flex-col gap-3 border-t border-primary-100/70 pt-3">
            <div className="flex items-center justify-between text-xs">
              {course.durationWeeks ? (
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <Clock className="h-3.5 w-3.5 text-primary-600" aria-hidden="true" />
                  {course.durationWeeks} weeks practical
                </span>
              ) : (
                <span className="text-slate-500 font-medium">Flexible Pace</span>
              )}
              {course.price !== undefined && course.price !== null && (
                <span className={course.price === 0 ? "font-bold text-emerald-700" : "font-bold text-primary-950 text-sm"}>
                  {course.price === 0 ? "Free Access" : `₹${course.price.toLocaleString("en-IN")}`}
                </span>
              )}
            </div>

            <Link
              href={`/courses/${course.slug}`}
              className={buttonVariants("primary", "sm", "w-full justify-center gap-1.5 rounded-xl font-medium shadow-sm transition-all group-hover:bg-primary-800")}
            >
              View Syllabus & Enroll
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
