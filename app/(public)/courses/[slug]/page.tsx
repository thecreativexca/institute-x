import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Container } from "@/components/ui/container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { getCategoryBySlug } from "@/lib/config/course-filters";
import {
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
  const course = await getPublishedCourseBySlug(slug);

  if (!course || course.status !== "published") {
    notFound();
  }

  const category = getCategoryBySlug(course.categorySlug);

  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: category?.name ?? "Courses", href: `/courses?category=${course.categorySlug}` },
          { label: course.name, href: `/courses/${course.slug}`, current: true },
        ]}
        className="mb-6"
      />

      {/* Hero Section */}
      <CourseHero course={course} category={category} />

      {/* Main Content Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Main Content - 2/3 width */}
        <div className="lg:col-span-2 space-y-10">
          {/* About This Course */}
          <section aria-labelledby="about-heading" className="space-y-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-card sm:p-7">
            <h2 id="about-heading" className="text-2xl font-semibold text-slate-900">
              About This Course
            </h2>
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
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

        {/* Sidebar - 1/3 width */}
        <aside className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Course Meta & Enrollment Card */}
            <CourseMeta course={course} category={category} />

            {/* Related Courses */}
            <RelatedCourses
              currentCourseSlug={course.slug}
              categorySlug={course.categorySlug}
              tags={course.tags}
            />
          </div>
        </aside>
      </div>

      {/* Bottom CTA Section */}
      <CourseCTA course={course} />
    </Container>
  );
}
