import type { Metadata } from "next";

import { CoursesCatalog } from "@/components/public/courses-catalog";
import { getPublicCourseCategories, getPublishedCourses } from "@/lib/catalog/public-courses";
import { toCourseSummary } from "@/lib/config/course-filters";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses & Professional Skill Programs",
  description: "Explore practical programs in technology, design, business and professional skills. Compare syllabus, duration, level and fee before enrolling.",
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ search?: string; category?: string }> }) {
  const { search = "", category = "" } = await searchParams;
  const [publishedCourses, categories] = await Promise.all([
    getPublishedCourses(),
    getPublicCourseCategories(),
  ]);

  return (
    <CoursesCatalog
      initialSearch={search}
      initialCategory={category}
      categories={categories}
      contactPhone={siteConfig.contact.phone}
      contactPhoneHref={siteConfig.contact.phoneHref}
      courses={publishedCourses.map((course) => ({
        course: toCourseSummary(course),
        tags: course.tags,
        categorySlug: course.adminCategorySlug ?? course.categorySlug,
      }))}
    />
  );
}
