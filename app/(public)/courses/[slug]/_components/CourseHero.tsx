import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { CatalogCourse, CatalogCategory } from "@/lib/config/catalog";

interface CourseHeroProps {
  course: CatalogCourse;
  category: CatalogCategory | undefined;
}

const levelLabels: Record<CatalogCourse["level"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  all_levels: "All Levels",
};

const learningModeLabels: Record<CatalogCourse["learningMode"], string> = {
  online: "Online",
  hybrid: "Hybrid",
  offline: "Offline",
};

export function CourseHero({ course, category }: CourseHeroProps) {
  const isFree = course.isFree || course.price === 0;
  const isPurchasable = course.isPurchasable !== false;
  const courseId = course._id ?? course.slug;

  return (
    <header className="public-hero-pattern relative mb-10 overflow-hidden rounded-[2rem] border border-primary-100 p-6 shadow-card-hover sm:p-8 lg:p-10">
      <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-25" />
      <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
        {/* Left Column - Content */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {category && <Badge variant="primary">{category.name}</Badge>}
            <Badge variant="neutral">{levelLabels[course.level]}</Badge>
            <Badge variant="warning">
              {course.durationWeeks} weeks
            </Badge>
            <Badge variant="neutral">
              {learningModeLabels[course.learningMode]}
            </Badge>
            {course.featured && <Badge variant="success">Featured</Badge>}
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.035em] text-primary-950 sm:text-4xl lg:text-5xl">
            {course.name}
          </h1>

          <p className="text-lg leading-relaxed text-slate-600 max-w-3xl">
            {course.shortDescription}
          </p>

          <div className="flex flex-wrap items-center gap-6 border-t border-primary-200 pt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{course.durationWeeks} weeks</span>
            </div>
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-400">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>{isFree ? "Free" : `₹${course.price.toLocaleString("en-IN")}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-slate-400">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
              <span>{learningModeLabels[course.learningMode]}</span>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href={isPurchasable ? `/checkout/${courseId}` : "/contact"}
              className={buttonVariants("primary", "lg", "w-full rounded-xl shadow-lg shadow-primary-900/10 sm:w-auto")}
            >
              {isPurchasable ? (isFree ? "Enroll for Free" : "Enroll Now") : "Enquire Now"}
            </Link>
            <Link href="/contact" className={buttonVariants("outline", "lg", "w-full rounded-xl border-primary-200 bg-white/80 text-primary-900 hover:bg-primary-50 sm:w-auto")}>
              Contact for Details
            </Link>
          </div>
        </div>

        {/* Right Column - Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border-4 border-white bg-surface-inset shadow-[0_22px_50px_-28px_rgb(22_71_47/0.55)]">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-20 w-20 text-primary-300"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          {course.featured && (
            <div className="absolute top-4 right-4">
              <Badge variant="success" className="px-3 py-1 text-sm">
                Featured Course
              </Badge>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
