import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroVisual } from "@/components/public/hero-visual";
import { ArrowRight, BadgeCheck, BookOpenCheck } from "lucide-react";

/**
 * Hero section.
 * Copy is intentionally neutral until the client provides real institute
 * details — no invented statistics, placement numbers or student counts.
 */
export function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="public-hero-pattern relative overflow-hidden border-b border-primary-100">
      <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-45" />
      <Container className="relative py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="lg:grid lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14">
            <div className="text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-accent-300 bg-accent-100/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-primary-900 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-primary-700" aria-hidden="true" />
                SKILL DEVELOPMENT & PROFESSIONAL TRAINING
              </p>
              <h1
                id="hero-heading"
                className="mt-6 text-balance text-4xl font-bold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-[3.65rem] lg:leading-[1.05]"
              >
                Learn practical skills.<br />
                <span className="relative inline-block text-primary-700">
                  Build your career.
                  <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-2 -rotate-1 rounded-full bg-accent-300/65 -z-10" />
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg lg:mx-0">
                Our institute provides structured, career-focused courses designed for
                students, job seekers, and professionals. From basic computer skills to
                full-stack development — gain practical expertise through guided learning.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Link href="/courses" className={buttonVariants("primary", "lg", "w-full rounded-xl shadow-lg shadow-primary-900/10 sm:w-auto")}>
                  Explore Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/register" className={buttonVariants("outline", "lg", "w-full rounded-xl border-primary-200 bg-white/80 text-primary-900 hover:border-primary-300 hover:bg-primary-50 sm:w-auto")}>
                  Join Now
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600 lg:justify-start">
                <span className="inline-flex items-center gap-2"><BookOpenCheck className="h-4 w-4 text-primary-600" aria-hidden="true" /> Guided curriculum</span>
                <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary-600" aria-hidden="true" /> Practical learning</span>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <HeroVisual />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
