import type { Metadata } from "next";

import { CtaSection } from "@/components/public/cta-section";
import { CategoryGrid } from "@/components/public/category-grid";
import { HeroSection } from "@/components/public/hero-section";
import { HowLearningWorksSection } from "@/components/public/how-learning-works-section";
import { PopularCoursesSection } from "@/components/public/popular-courses-section";
import { TrustBar } from "@/components/public/trust-bar";
import { TrustBenefitsSection } from "@/components/public/trust-benefits-section";
import { WhyChooseUsSection } from "@/components/public/why-choose-us-section";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practical Online Courses for Career & Digital Skills",
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `Learn practical skills online | ${siteConfig.name}`,
    description: siteConfig.description,
  },
};

export default async function HomePage() {
  const courses = await getPublishedCourses();
  const featuredCourse = courses.find((course) => course.featured) ?? courses[0];
  const totalLessons = courses.reduce(
    (courseTotal, course) =>
      courseTotal + course.syllabus.reduce((moduleTotal, module) => moduleTotal + module.lessons.length, 0),
    0
  );

  return (
    <>
      <HeroSection
        featuredCourse={featuredCourse}
        totalCourses={courses.length}
        totalLessons={totalLessons}
      />
      <TrustBar />
      <CategoryGrid />
      <PopularCoursesSection courses={courses} />
      <TrustBenefitsSection />
      <WhyChooseUsSection />
      <HowLearningWorksSection />
      <CtaSection />
    </>
  );
}
