import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getCategoryBySlug } from "@/lib/config/course-filters";
import {
  getPublishedCourses,
  getPublishedCourseBySlug,
} from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";
import { CourseHero } from "./_components/CourseHero";
import { CourseCurriculum } from "./_components/CourseCurriculum";
import { LearningOutcomes } from "./_components/LearningOutcomes";
import { CourseRequirements } from "./_components/CourseRequirements";
import { TargetAudience } from "./_components/TargetAudience";
import { InstructorSection } from "./_components/InstructorSection";
import { LearningExperience } from "./_components/LearningExperience";
import { CourseFAQ } from "./_components/CourseFAQ";
import { CourseCTA } from "./_components/CourseCTA";
import { RelatedCourses } from "./_components/RelatedCourses";
import { CourseMeta } from "./_components/CourseMeta";

/**
 * Course detail page — MongoDB is authoritative (Phase 17 req. 75). Office
 * publish/archive/unpublish updates appear immediately; drafts 404 here.
 */
export const dynamic = "force-dynamic";

interface CourseDetailPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for each course page
 */
export async function generateMetadata({ params }: CourseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourseBySlug(slug);

  if (!course) {
    return { title: "Course Not Found" };
  }

  const pageUrl = `${siteConfig.url}/courses/${course.slug}`;

  return {
    title: course.name,
    description: course.shortDescription,
    openGraph: {
      title: `${course.name} | ${siteConfig.name}`,
      description: course.shortDescription,
      type: "website",
      url: pageUrl,
      siteName: siteConfig.name,
      images: course.thumbnailUrl
        ? [{ url: course.thumbnailUrl, width: 1200, height: 630 }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.name} | ${siteConfig.name}`,
      description: course.shortDescription,
      images: course.thumbnailUrl ? [course.thumbnailUrl] : [],
    },
    other: {
      "course:course_name": course.name,
      "course:category": course.categorySlug,
      "course:price": course.price.toString(),
      "course:currency": "INR",
    },
  };
}

/**
 * Course detail page - complete Phase 4 implementation
 */
export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { slug } = await params;
  const courses = await getPublishedCourses();
  const course = courses.find((candidate) => candidate.slug === slug);

  if (!course || course.status !== "published") {
    notFound();
  }

  const category = getCategoryBySlug(course.categorySlug);

  return (
    <div className="course-detail-page">
    <Container className="course-detail-shell">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: category?.name ?? "Courses", href: `/courses?category=${course.categorySlug}` },
          { label: course.name, href: `/courses/${course.slug}`, current: true },
        ]}
        className="course-detail-breadcrumb"
      />

      <CourseHero course={course} category={category} />

      <nav className="course-detail-nav" aria-label="Course page sections">
        <a href="#course-overview">Overview</a>
        <a href="#learning-outcomes">What you&rsquo;ll learn</a>
        <a href="#course-curriculum">Curriculum</a>
        <a href="#enrollment-request">Admission</a>
      </nav>

      <div className="course-content-grid">
        <div className="course-content-main">
          <section id="course-overview" aria-labelledby="about-heading" className="course-about-card scroll-mt-32">
            <span className="course-section-kicker">Course overview</span>
            <h2 id="about-heading">Build practical skills, one clear step at a time</h2>
            <div className="course-about-copy">
              <p>{course.description}</p>
            </div>
          </section>

          {/* Learning Outcomes */}
          <LearningOutcomes outcomes={course.learningOutcomes} />

          {/* Course Curriculum */}
          <CourseCurriculum syllabus={course.syllabus} />

          {/* Course Requirements */}
          <CourseRequirements requirements={course.requirements} />

          {/* Who Should Take This Course */}
          <TargetAudience audience={course.targetAudience} />

          {/* Instructor Section */}
          <InstructorSection instructor={course.instructor} />

          {/* Learning Experience */}
          <LearningExperience features={course.learningFeatures} />

          {/* FAQ Section */}
          <CourseFAQ faqs={course.faqs} />
        </div>

        <aside>
          <div className="course-sidebar-stack">
            <CourseMeta course={course} category={category} />
            <RelatedCourses
              currentCourseSlug={course.slug}
              categorySlug={course.categorySlug}
              tags={course.tags}
              courses={courses}
            />
          </div>
        </aside>
      </div>

      <CourseCTA course={course} />
    </Container>
    </div>
  );
}
