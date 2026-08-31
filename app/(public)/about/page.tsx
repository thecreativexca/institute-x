import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  HeartHandshake,
  Lightbulb,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about the institute, its mission and approach to training.",
};

const approachPoints = [
  {
    icon: BookOpenCheck,
    title: "Start with strong foundations",
    description: "Lessons follow a clear order, helping learners understand each concept before moving ahead.",
  },
  {
    icon: Lightbulb,
    title: "Learn by doing",
    description: "Exercises, assignments and practical tasks turn new ideas into skills you can actually use.",
  },
  {
    icon: CheckCircle2,
    title: "Track real progress",
    description: "Modules, assessments and completion tracking make the learning journey easy to follow.",
  },
  {
    icon: HeartHandshake,
    title: "Get support when needed",
    description: "A guided learning environment and office support help students keep moving forward.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="public-hero-pattern relative overflow-hidden border-b border-primary-100">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />
        <Container className="relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">
                About the institute
              </span>
              <h1 className="mt-6 max-w-3xl text-balance text-4xl font-bold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-6xl">
                Practical learning, built around your progress.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                We are a skill development institute focused on structured, career-oriented training that helps learners build confidence one practical step at a time.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/courses" className={buttonVariants("primary", "lg", "rounded-xl")}>
                  Explore courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/contact" className={buttonVariants("outline", "lg", "rounded-xl border-primary-200 bg-white/80 text-primary-900 hover:bg-primary-50")}>
                  Talk to our office
                </Link>
              </div>
            </div>

            <div className="relative rounded-[2rem] border border-primary-200 bg-white/90 p-6 shadow-card-hover sm:p-8">
              <div aria-hidden="true" className="absolute -right-4 -top-4 h-20 w-20 rounded-3xl bg-accent-200/80" />
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
                  <Target className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Our mission</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-primary-950">
                  Make quality skill education clear, practical and accessible.
                </h2>
                <p className="mt-4 leading-7 text-slate-600">
                  Our programs are designed to help learners gain useful knowledge through guided practice, measurable progress and a supportive learning environment.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#fffef8]">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">Our approach</span>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-primary-950 sm:text-4xl">
              A learning experience that keeps every step useful
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              From the first lesson to the final assessment, each part of the course has a clear purpose.
            </p>
          </div>

          <ul className="mx-auto mt-12 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {approachPoints.map(({ icon: Icon, title, description }, index) => (
              <li key={title} className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-bold text-accent-300">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-primary-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-primary-100 bg-primary-50/70">
        <Container className="py-14 sm:py-16">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 rounded-[1.75rem] border border-primary-200 bg-white p-7 text-center shadow-card sm:p-10 lg:flex-row lg:text-left">
            <div>
              <p className="text-sm font-semibold text-primary-700">Find the right learning path</p>
              <h2 className="mt-2 text-2xl font-semibold text-primary-950">Ready to build your next skill?</h2>
            </div>
            <Link href="/courses" className={buttonVariants("primary", "lg", "shrink-0 rounded-xl")}>
              View all courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
