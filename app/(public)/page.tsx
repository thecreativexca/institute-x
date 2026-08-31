import type { Metadata } from "next";

import { BenefitsSection } from "@/components/public/benefits-section";
import { CareerSection } from "@/components/public/career-section";
import { CategoryGrid } from "@/components/public/category-grid";
import { CtaSection } from "@/components/public/cta-section";
import { HeroSection } from "@/components/public/hero-section";
import { HowLearningWorksSection } from "@/components/public/how-learning-works-section";
import { IntroSection } from "@/components/public/intro-section";
import { PopularCoursesSection } from "@/components/public/popular-courses-section";
import { StudentDashboardPreviewSection } from "@/components/public/student-dashboard-preview-section";
import { TrustBenefitsSection } from "@/components/public/trust-benefits-section";
import { WhyChooseUsSection } from "@/components/public/why-choose-us-section";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

/**
 * Home page — Phase 2 professional public website.
 * Sections composed from reusable server components.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBenefitsSection />
      <IntroSection />
      <CategoryGrid />
      <PopularCoursesSection />
      <WhyChooseUsSection />
      <HowLearningWorksSection />
      <StudentDashboardPreviewSection />
      <BenefitsSection />
      <CareerSection />
      <CtaSection />
    </>
  );
}
