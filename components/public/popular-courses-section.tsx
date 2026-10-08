import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";

import { CourseCard } from "@/components/public/course-card";
import { Container } from "@/components/ui/container";
import { toCourseSummary } from "@/lib/config/course-filters";
import type { CatalogCourse } from "@/lib/config/catalog";

interface PopularCoursesSectionProps { courses: CatalogCourse[]; }

export function PopularCoursesSection({ courses }: PopularCoursesSectionProps) {
  const visibleCourses = courses.slice(0, 6);
  return (
    <section className="education-courses" aria-labelledby="popular-courses-heading">
      <Container>
        <div className="education-section-heading" data-reveal>
          <div>
            <span className="education-eyebrow"><GraduationCap className="h-4 w-4" /> Learn something useful</span>
            <h2 id="popular-courses-heading">Popular courses to start with</h2>
          </div>
          <Link href="/courses" className="education-text-link">View all courses <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {visibleCourses.length ? (
          <ul className="education-course-grid" data-reveal>
            {visibleCourses.map((course) => <li key={course.slug}><CourseCard course={toCourseSummary(course)} /></li>)}
          </ul>
        ) : <p className="education-empty">Published courses will appear here automatically.</p>}
      </Container>
    </section>
  );
}
