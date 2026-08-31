import Link from "next/link";

import { CourseCard } from "@/components/public/course-card";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { CATALOG_COURSES, getCategoryBySlug } from "@/lib/config/catalog";
import type { CourseSummary } from "@/types/course";

/**
 * Popular courses preview.
 *
 * Curated homepage selection from the canonical course catalog.
 */
const sampleSlugs = [
  "basic-computer-course",
  "web-development",
  "graphic-design",
  "digital-marketing",
  "tally-accounting",
  "spoken-english-personality-development",
] as const;

function buildSampleSummaries(): CourseSummary[] {
  return sampleSlugs.flatMap((slug) => {
    const course = CATALOG_COURSES.find((c) => c.slug === slug);
    if (!course) return [];
    const category = getCategoryBySlug(course.categorySlug);
    const durationMap: Record<string, number> = {
      "basic-computer-course": 8,
      "web-development": 16,
      "graphic-design": 12,
      "digital-marketing": 10,
      "tally-accounting": 6,
      "spoken-english-personality-development": 8,
    };
    const priceMap: Record<string, number> = {
      "basic-computer-course": 8000,
      "web-development": 25000,
      "graphic-design": 18000,
      "digital-marketing": 15000,
      "tally-accounting": 10000,
      "spoken-english-personality-development": 12000,
    };
    return [
      {
        id: `sample-${course.slug}`,
        name: course.name,
        slug: course.slug,
        shortDescription: course.shortDescription,
        categoryName: category?.name,
        level: "beginner" as const,
        status: "draft" as const,
        durationWeeks: durationMap[course.slug],
        price: priceMap[course.slug],
        currency: "INR",
      },
    ];
  });
}

export function PopularCoursesSection() {
  const samples = buildSampleSummaries();

  return (
    <section aria-labelledby="popular-courses-heading" className="bg-[#fffef8]">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Courses"
          title="Popular programs at our institute"
          description="Explore career-focused programs across technology, office skills, design, communication, and professional development."
        />
        <div className="mt-8 flex justify-center">
          <span className="rounded-full border border-accent-200 bg-accent-50 px-3 py-1 text-xs font-medium text-accent-800">
            Career-focused course catalog
          </span>
        </div>

        {samples.length > 0 ? (
          <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {samples.map((course) => (
              <li key={course.id} className="h-full">
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-10"
            title="Course catalog is being prepared"
            description="Course listings will appear here once published by the institute office."
          />
        )}

        <div className="mt-10 text-center">
          <Link href="/courses" className={buttonVariants("outline", "md")}>
            View all courses
          </Link>
        </div>
      </Container>
    </section>
  );
}
