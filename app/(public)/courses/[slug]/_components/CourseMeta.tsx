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
  const hasDiscount = comparePrice && comparePrice > price;
  const savings = hasDiscount ? comparePrice - price : 0;
  const includedFeatures = [
    `${totalModules} structured ${totalModules === 1 ? "module" : "modules"}`,
    `${totalLessons} ${totalLessons === 1 ? "lesson" : "lessons"} in the current syllabus`,
    "Student dashboard access",
    "Lesson progress tracking",
    "Support through your student portal",
  ];

  return (
    <>
      {/* Enrollment Card */}
      <div className="course-sidebar-card p-6">
        <div className="text-center mb-4">
          {isFree ? (
            <span className="text-3xl font-bold text-amber-700">FREE</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                  <span className="line-through text-slate-500">₹{comparePrice!.toLocaleString("en-IN")}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                    Save ₹{savings.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <p className="mt-1 text-sm text-slate-500">One-time course fee</p>
            </>
          )}
        </div>
        <ul className="mb-6 space-y-3 border-t border-primary-100 pt-4">
          {includedFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5">
                <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        <Link href="#enrollment-request" className={buttonVariants("primary", "lg", "w-full")}>
          Send admission request
        </Link>
        <p className="mt-3 text-center text-xs leading-5 text-slate-500">No online payment is taken here. Our team will contact you with the next steps.</p>
      </div>

      {/* Course Details */}
      <div className="mt-5 border border-primary-300 bg-transparent p-6">
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
                <span className="text-amber-700">FREE</span>
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
