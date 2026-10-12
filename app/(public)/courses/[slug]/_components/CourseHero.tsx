import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Award, BookOpenCheck, GraduationCap, PlayCircle } from "lucide-react";

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
        <div className="course-detail-eyebrow">
          <span><GraduationCap aria-hidden="true" /> {category?.name ?? "Professional course"}</span>
          <span>Admissions open</span>
        </div>
        <h1>{course.name}</h1>
        <p className="course-detail-lead">{course.shortDescription}</p>
        <div className="course-detail-actions">
          <Link href="#enrollment-request" className="course-primary-cta">
            Request admission <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="#course-curriculum" className="course-secondary-cta">
            <PlayCircle aria-hidden="true" /> View curriculum
          </Link>
        </div>
        <div className="course-detail-trust">
          <span><Award aria-hidden="true" /> Practical curriculum</span>
          <span><BookOpenCheck aria-hidden="true" /> Guided learning</span>
        </div>
      </div>
      <div className="course-detail-media" data-reveal>
        <Image src={image} alt={`${course.name} course`} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-contain" />
      </div>
      <div className="course-detail-meta" aria-label="Course summary">
        <div><span>01</span><strong>{course.syllabus.length}</strong><small>Modules</small></div>
        <div><span>02</span><strong>{totalLessons}</strong><small>Lessons</small></div>
        <div><span>03</span><strong>{levelLabels[course.level]}</strong><small>Level</small></div>
        <div><span>04</span><strong>{course.learningMode}</strong><small>Mode</small></div>
      </div>
    </header>
  );
}
