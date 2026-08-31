import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { CatalogCourse, CatalogCategory } from "@/lib/config/catalog";

interface CourseMetaProps {
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

export function CourseMeta({ course, category }: CourseMetaProps) {
  const totalLessons = course.syllabus?.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const totalModules = course.syllabus?.length ?? 0;
  const price = course.price ?? 0;
  const comparePrice = course.compareAtPrice;
  const isFree = course.isFree || price === 0;
  const isPurchasable = course.isPurchasable !== false;
  const hasDiscount = comparePrice && comparePrice > price;
  const courseId = course._id ?? course.slug;

  return (
    <>
      {/* Enrollment Card */}
      <div className="rounded-2xl border border-primary-200 bg-white p-6 shadow-card-hover">
        <div className="text-center mb-4">
          {isFree ? (
            <span className="text-3xl font-bold text-emerald-600">FREE</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <p className="mt-1 text-sm line-through text-slate-500">
                  ₹{comparePrice!.toLocaleString("en-IN")}
                </p>
              )}
              <p className="text-sm text-slate-500">One-time payment • Lifetime access</p>
            </>
          )}
        </div>
        <ul className="mb-6 space-y-3 border-t border-primary-100 pt-4">
          {[
            "Lifetime access to course materials",
            "Video lessons + downloadable resources",
            "Hands-on assignments & quizzes",
            "Certificate on completion",
            "Access to student community",
            "Email support from instructors",
          ].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        {!isPurchasable ? (
          <Link
            href="/contact"
            className={buttonVariants("primary", "lg", "w-full")}
          >
            Enquire Now
          </Link>
        ) : isFree ? (
          <Link
            href={`/checkout/${courseId}`}
            className={buttonVariants("primary", "lg", "w-full")}
          >
            Enroll for Free
          </Link>
        ) : (
          <Link
            href={`/checkout/${courseId}`}
            className={buttonVariants("primary", "lg", "w-full")}
          >
            Enroll Now
          </Link>
        )}
      </div>

      {/* Course Details */}
      <div className="rounded-2xl border border-primary-100 bg-primary-50/65 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Course Details</h3>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Level</dt>
            <dd className="font-medium text-slate-900">{levelLabels[course.level]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Duration</dt>
            <dd className="font-medium text-slate-900">{course.durationWeeks} weeks</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Learning Mode</dt>
            <dd className="font-medium text-slate-900">{learningModeLabels[course.learningMode]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Modules</dt>
            <dd className="font-medium text-slate-900">{totalModules}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Lessons</dt>
            <dd className="font-medium text-slate-900">{totalLessons}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium text-slate-900">{category?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Price</dt>
            <dd className="font-medium text-slate-900">
              {isFree ? (
                <span className="text-emerald-600">FREE</span>
              ) : (
                <>
                  ₹{price.toLocaleString("en-IN")}
                  {hasDiscount && (
                    <span className="ml-2 text-sm line-through text-slate-500">
                      ₹{comparePrice!.toLocaleString("en-IN")}
                    </span>
                  )}
                </>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
