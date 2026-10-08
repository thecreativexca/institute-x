import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock3, GraduationCap } from "lucide-react";

import { getCourseImage } from "@/lib/utils/course-images";
import type { CourseSummary } from "@/types/course";

const levelLabels: Record<CourseSummary["level"], string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", all_levels: "All levels",
};

export interface CourseCardProps { course: CourseSummary; variant?: "default" | "compact"; index?: number; }

export function CourseCard({ course }: CourseCardProps) {
  const imageSrc = course.thumbnailUrl || getCourseImage(course.slug, undefined, course.categoryName);
  const price = course.price === 0 ? "Free" : course.price != null ? `₹${course.price.toLocaleString("en-IN")}` : "Ask for fee";

  return (
    <article className="course-card-v2">
      <Link href={`/courses/${course.slug}`} className="course-card-v2-media">
        <Image src={imageSrc} alt={`${course.name} course`} fill sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" className="object-cover" />
        <span className="course-card-v2-level">{levelLabels[course.level]}</span>
        {course.featured ? <span className="course-card-v2-featured">Featured</span> : null}
      </Link>
      <div className="course-card-v2-body">
        <p className="course-card-v2-category">{course.categoryName || "Professional skills"}</p>
        <h3><Link href={`/courses/${course.slug}`}>{course.name}</Link></h3>
        {course.shortDescription ? <p className="course-card-v2-description">{course.shortDescription}</p> : null}

        <div className="course-card-v2-meta">
          <span><Clock3 className="h-4 w-4" aria-hidden="true" /> {course.durationWeeks ? `${course.durationWeeks} weeks` : "Flexible"}</span>
          <span><GraduationCap className="h-4 w-4" aria-hidden="true" /> {levelLabels[course.level]}</span>
        </div>

        <div className="course-card-v2-footer">
          <div><small>Course fee</small><strong>{price}</strong></div>
          <Link href={`/courses/${course.slug}`} aria-label={`View ${course.name}`}><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></Link>
        </div>
      </div>
    </article>
  );
}
