import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { CatalogCategory, CatalogCourse } from "@/lib/config/catalog";
import { getCourseImage } from "@/lib/utils/course-images";

interface CourseHeroProps { course: CatalogCourse; category: CatalogCategory | undefined; }

const levelLabels: Record<CatalogCourse["level"], string> = {
  beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", all_levels: "All levels",
};

export function CourseHero({ course, category }: CourseHeroProps) {
  const totalLessons = course.syllabus.reduce((sum, module) => sum + module.lessons.length, 0);
  const image = course.thumbnailUrl || getCourseImage(course.slug, undefined, course.categorySlug);

  return (
    <header className="course-detail-hero">
      <div className="course-detail-copy" data-reveal>
        <div>
          <div className="course-detail-badges">
            {category ? <span>{category.name}</span> : null}
            <span>{levelLabels[course.level]}</span>
            <span>{course.durationWeeks} weeks</span>
          </div>
          <h1 className="mt-8">{course.name}</h1>
          <p className="mt-7 text-base sm:text-lg">{course.shortDescription}</p>
        </div>

        <div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="#enrollment-request" className="public-button">
              Request admission
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact" className="public-button-line">Ask a question</Link>
          </div>
          <div className="course-detail-meta">
            <div><strong>{course.syllabus.length}</strong><span>Modules</span></div>
            <div><strong>{totalLessons}</strong><span>Lessons</span></div>
            <div><strong>{levelLabels[course.level]}</strong><span>Level</span></div>
            <div><strong>{course.learningMode}</strong><span>Mode</span></div>
          </div>
        </div>
      </div>
      <div className="course-detail-media" data-reveal>
        <Image src={image} alt={`${course.name} course`} fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
      </div>
    </header>
  );
}
