import type { Metadata } from "next";

import { BenefitsSection } from "@/components/public/benefits-section";
import { CampusShowcaseSection } from "@/components/public/campus-showcase-section";
import { CareerSection } from "@/components/public/career-section";
import { CategoryGrid } from "@/components/public/category-grid";
import { CertificateShowcaseSection } from "@/components/public/certificate-showcase-section";
import { CtaSection } from "@/components/public/cta-section";
import { HeroSection } from "@/components/public/hero-section";
import { HowLearningWorksSection } from "@/components/public/how-learning-works-section";
import { PopularCoursesSection } from "@/components/public/popular-courses-section";
import { StudentDashboardPreviewSection } from "@/components/public/student-dashboard-preview-section";
import { TestimonialsSection } from "@/components/public/testimonials-section";
import { TrustBenefitsSection } from "@/components/public/trust-benefits-section";
import { WhyChooseUsSection } from "@/components/public/why-choose-us-section";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  description: siteConfig.description,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Premier Technology & Vocational Institute`,
    description: siteConfig.description,
  },
};

/**
 * Home page — High-end Institute experience with authentic campus imagery,
 * practical labs showcase, course covers, certified credentials, and alumni reviews.
 */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustBenefitsSection />
      <CategoryGrid />
      <PopularCoursesSection />
      <CampusShowcaseSection />
      <WhyChooseUsSection />
      <CertificateShowcaseSection />
      <HowLearningWorksSection />
      <TestimonialsSection />
      <StudentDashboardPreviewSection />
      <BenefitsSection />
      <CareerSection />
      <CtaSection />
    </>
  );
}
