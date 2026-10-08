import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenCheck, Phone, Search, Sparkles } from "lucide-react";

import { Container } from "@/components/ui/container";
import type { CatalogCourse } from "@/lib/config/catalog";
import { COURSE_CATEGORIES } from "@/lib/config/catalog";
import { siteConfig } from "@/lib/config/site";

interface HeroSectionProps {
  featuredCourse?: CatalogCourse;
  totalCourses: number;
  totalLessons: number;
}

export function HeroSection({ featuredCourse, totalCourses, totalLessons }: HeroSectionProps) {
  return (
    <section aria-labelledby="hero-heading" className="home-hero-v2">
      <div className="home-hero-v2-orb" aria-hidden="true" />
      <Container>
        <div className="home-hero-v2-grid">
          <div className="home-hero-v2-copy" data-reveal>
            <span className="home-hero-v2-kicker"><Sparkles className="h-4 w-4" aria-hidden="true" /> Admissions are open</span>
            <h1 id="hero-heading">Skills that turn ideas into <em>real work.</em></h1>
            <p>Practical courses with a visible syllabus, focused lessons and personal admission guidance—built for students who want a clear next step.</p>

            <div className="home-hero-v2-actions">
              <Link href="/courses" className="home-hero-v2-primary">Explore all courses <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href={siteConfig.contact.phoneHref} className="home-hero-v2-secondary"><Phone className="h-4 w-4" aria-hidden="true" /> {siteConfig.contact.phone}</a>
            </div>

            <form action="/courses" className="home-hero-v2-search" role="search">
              <Search className="h-5 w-5" aria-hidden="true" />
              <label htmlFor="home-course-search" className="sr-only">Search courses</label>
              <input id="home-course-search" name="search" type="search" placeholder="Search web, design, office skills…" autoComplete="off" />
              <button type="submit">Find a course</button>
            </form>

            <div className="home-hero-v2-points">
              <span><BadgeCheck className="h-4 w-4" aria-hidden="true" /> Full syllabus before admission</span>
              <span><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Structured learning path</span>
            </div>
          </div>

          <div className="home-hero-v2-visual" data-reveal>
            <div className="home-hero-v2-photo">
              <Image src="/images/hero-computer-lab.jpg" alt="Students learning practical computer skills in a classroom" fill priority sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" />
            </div>
            <div className="home-hero-v2-badge">
              <span />
              <div><strong>Admission support</strong><small>Talk directly with our team</small></div>
            </div>
            <div className="home-hero-v2-featured">
              <span>Featured program</span>
              <strong>{featuredCourse?.name ?? "Practical career skills"}</strong>
              {featuredCourse ? <Link href={`/courses/${featuredCourse.slug}`}>View course <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link> : <Link href="/courses">Browse courses <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </div>
          </div>
        </div>

        <div className="home-hero-v2-footer" data-reveal>
          <div><strong>{totalCourses}</strong><span>Published programs</span></div>
          <div><strong>{totalLessons}</strong><span>Lessons in the catalog</span></div>
          <div><strong>{COURSE_CATEGORIES.length}</strong><span>Skill categories</span></div>
          <p>Course details, fees and learning paths are visible before you submit an admission request.</p>
        </div>
      </Container>
    </section>
  );
}
