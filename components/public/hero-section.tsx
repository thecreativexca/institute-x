import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, Calendar, PhoneCall, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroVisual } from "@/components/public/hero-visual";
import { siteConfig } from "@/lib/config/site";

/**
 * Enhanced Institute Hero Section — welcoming, inspiring, and professional.
 */
export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="public-hero-pattern relative overflow-hidden border-b border-primary-100 bg-gradient-to-b from-primary-50/50 via-white to-white"
    >
      <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />

      <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-14">
            {/* Left Column: Heading & Calls to Action */}
            <div className="text-center lg:text-left">
              {/* Trust Tag */}
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-950 shadow-sm backdrop-blur-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                <span>Premier Skill & Computer Institute</span>
              </div>

              {/* Main Headline */}
              <h1
                id="hero-heading"
                className="mt-6 text-balance text-4xl font-extrabold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.1]"
              >
                Practical Learning.{" "}
                <span className="relative inline-block text-primary-700">
                  Real Careers.
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-1.5 h-2.5 -rotate-1 rounded-full bg-accent-300/80 -z-10"
                  />
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                Welcome to <strong className="font-semibold text-primary-950">{siteConfig.name}</strong>.
                We provide hands-on, job-oriented training in Web Programming, Tally & Accounting, Graphic Design,
                Office Skills, and Professional Spoken English with dedicated lab practice and verifiable certification.
              </p>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/courses"
                  className={buttonVariants("primary", "lg", "w-full rounded-xl shadow-lg shadow-primary-900/15 sm:w-auto font-semibold")}
                >
                  Explore All Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className={buttonVariants(
                    "outline",
                    "lg",
                    "w-full rounded-xl border-primary-200 bg-white text-primary-950 hover:border-primary-300 hover:bg-primary-50 sm:w-auto font-semibold shadow-sm"
                  )}
                >
                  <PhoneCall className="h-4 w-4 text-primary-700 mr-1.5" aria-hidden="true" />
                  Book Free Demo Class
                </Link>
              </div>

              {/* Key Features Pill */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm font-medium text-slate-700 lg:justify-start">
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  Daily Lab Practice
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpenCheck className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  Recognized Diploma
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary-600" aria-hidden="true" />
                  Flexible Batches
                </span>
              </div>
            </div>

            {/* Right Column: Institute Visual */}
            <div className="mt-12 lg:mt-0">
              <HeroVisual />
            </div>
          </div>
        </div>
      </Container>

      {/* Institute Credibility Bar */}
      <div className="border-t border-primary-100 bg-white/80 py-5 backdrop-blur-md">
        <Container>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div className="border-r border-slate-100 last:border-none sm:border-r">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-950">10,000+</p>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">Students Trained</p>
            </div>
            <div className="border-r-0 sm:border-r border-slate-100">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-950">16+</p>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">Career Programs</p>
            </div>
            <div className="border-r border-slate-100 last:border-none sm:border-r">
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-950">100%</p>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">Hands-on Labs</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-primary-950">4.9 ★</p>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">Student Rating</p>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
