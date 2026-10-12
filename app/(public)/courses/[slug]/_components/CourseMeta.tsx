import Link from "next/link";
import { ArrowRight, Check, Clock3, Layers3, MonitorPlay, ShieldCheck } from "lucide-react";
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
      <div className="course-sidebar-card">
        <div className="course-sidebar-card-head">
          <span>Course fee</span>
          {isFree ? (
            <strong>FREE</strong>
          ) : (
            <>
              <strong>
                ₹{price.toLocaleString("en-IN")}
              </strong>
              {hasDiscount && (
                <div className="course-price-saving">
                  <span>₹{comparePrice!.toLocaleString("en-IN")}</span>
                  <em>
                    Save ₹{savings.toLocaleString("en-IN")}
                  </em>
                </div>
              )}
              <p>One-time course fee</p>
            </>
          )}
        </div>
        <ul className="course-includes-list">
          {includedFeatures.map((feature) => (
            <li key={feature}><Check aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
        <Link href="#enrollment-request" className="course-sidebar-cta">
          Send admission request <ArrowRight aria-hidden="true" />
        </Link>
        <p className="course-sidebar-note"><ShieldCheck aria-hidden="true" /> No online payment is taken here</p>
      </div>

      <div className="course-facts-card">
        <h3>Course details</h3>
        <dl>
          <div>
            <dt className="text-slate-500">Level</dt>
            <dd className="font-medium text-slate-900">{levelLabels[course.level]}</dd>
          </div>
          <div>
            <dt><Clock3 aria-hidden="true" /> Duration</dt>
            <dd>{course.durationWeeks} months</dd>
          </div>
          <div>
            <dt><MonitorPlay aria-hidden="true" /> Learning mode</dt>
            <dd>{learningModeLabels[course.learningMode]}</dd>
          </div>
          <div>
            <dt><Layers3 aria-hidden="true" /> Curriculum</dt>
            <dd>{totalModules} modules · {totalLessons} lessons</dd>
          </div>
          <div>
            <dt className="text-slate-500">Category</dt>
            <dd className="font-medium text-slate-900">{category?.name}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
