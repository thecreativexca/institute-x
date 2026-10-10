"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, BriefcaseBusiness, Clock3, GraduationCap, MessageCircleMore, Search, Wrench, X } from "lucide-react";

import { CourseCard } from "@/components/public/course-card";
import { Container } from "@/components/ui/container";
import type { CourseSummary } from "@/types/course";

export interface SearchableCourse {
  course: CourseSummary;
  tags: string[];
}

const learningBenefits = [
  { icon: Wrench, title: "Practical skills", body: "Focus on useful capabilities and apply what you learn." },
  { icon: Clock3, title: "Flexible learning", body: "Use structured lessons and resources in a clear sequence." },
  { icon: GraduationCap, title: "Beginner friendly", body: "Course levels help you choose a suitable starting point." },
  { icon: BriefcaseBusiness, title: "Career focused", body: "Build digital and professional skills for real work contexts." },
];

interface CoursesCatalogProps {
  courses: SearchableCourse[];
  initialSearch: string;
  contactPhone: string;
  contactPhoneHref: string;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function CoursesCatalog({ courses, initialSearch, contactPhone, contactPhoneHref }: CoursesCatalogProps) {
  const [search, setSearch] = useState(initialSearch);
  const deferredSearch = useDeferredValue(search);

  const filteredCourses = useMemo(() => {
    const query = normalize(deferredSearch);
    if (!query) return courses;

    return courses.filter(({ course, tags }) =>
      [course.name, course.shortDescription, course.categoryName, ...tags]
        .filter(Boolean)
        .some((value) => normalize(String(value)).includes(query))
    );
  }, [courses, deferredSearch]);

  function updateSearch(value: string) {
    setSearch(value);
    const url = new URL(window.location.href);
    if (value.trim()) url.searchParams.set("search", value.trim());
    else url.searchParams.delete("search");
    url.searchParams.delete("category");
    url.searchParams.delete("level");
    url.searchParams.delete("duration");
    url.searchParams.delete("sort");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  return (
    <>
      <section className="catalog-hero-v2">
        <Container>
          <div className="catalog-hero-v2-grid">
            <div data-reveal>
              <span className="catalog-hero-v2-kicker"><BookOpenCheck className="h-4 w-4" aria-hidden="true" /> Course library</span>
              <h1>Find the skill that moves you <em>forward.</em></h1>
              <p>Explore practical programs for technology, design, office work and professional growth. Every course page explains the syllabus, duration and learning level before you enquire.</p>
              <div className="catalog-hero-v2-contact">
                <MessageCircleMore className="h-5 w-5" aria-hidden="true" />
                <span>Not sure where to start?</span>
                <Link href="/contact">Ask our team <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
              </div>
            </div>

            <div className="catalog-hero-v2-visual" data-reveal>
              <Image src="/images/study-desk.jpg" alt="Online course learning workspace with a laptop" fill priority sizes="(max-width: 1024px) 100vw, 44vw" className="object-cover" />
              <div><BookOpenCheck className="h-5 w-5" aria-hidden="true" /><span><strong>Choose with clarity</strong>Course details before you enquire</span></div>
            </div>
          </div>
        </Container>
      </section>

      <section className="catalog-v2">
        <Container>
          <div className="catalog-v2-heading">
            <div>
              <span>Practical, skill-based learning</span>
              <h2>All courses</h2>
              <p>Build useful skills through clear modules, focused lessons and learning you can apply beyond the classroom.</p>
            </div>
            <div className="catalog-v2-heading-actions" aria-live="polite">
              <p><strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "result" : "results"}</p>
            </div>
          </div>

          <div className="catalog-search-panel">
            <label htmlFor="course-catalog-search">Search courses</label>
            <div className="catalog-search-field catalog-search-field-light">
              <Search className="h-5 w-5" aria-hidden="true" />
              <input id="course-catalog-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Search courses..." autoComplete="off" />
              {search ? <button type="button" onClick={() => updateSearch("")} aria-label="Clear course search"><X className="h-5 w-5" aria-hidden="true" /></button> : null}
            </div>
            <div className="catalog-search-meta catalog-search-meta-light"><p><strong>{filteredCourses.length}</strong> {filteredCourses.length === 1 ? "course" : "courses"} found</p><p>Admissions: <a href={contactPhoneHref}>{contactPhone}</a></p></div>
          </div>

          {filteredCourses.length ? (
            <ul className="catalog-grid-v2" role="list">
              {filteredCourses.map(({ course }) => <li key={course.slug}><CourseCard course={course} /></li>)}
            </ul>
          ) : (
            <div className="catalog-empty" role="status">
              <Search className="h-8 w-8" aria-hidden="true" />
              <h3>No courses found</h3>
              <p>We could not find a course matching “{search}”. Try a broader skill, subject or category.</p>
              <button type="button" onClick={() => updateSearch("")}>Clear search</button>
            </div>
          )}
        </Container>
      </section>

      <section className="course-benefits">
        <Container>
          <div className="education-section-heading"><div><span className="public-kicker">Why learn with us</span><h2>Learning designed to stay useful.</h2></div><p>Clear course information, structured progression and practical focus help you make a more confident learning decision.</p></div>
          <div className="course-benefit-grid">{learningBenefits.map(({ icon: Icon, title, body }) => <article key={title} data-reveal><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}</div>
        </Container>
      </section>

      <section className="course-guidance-cta">
        <Container><div><span className="public-kicker">Course guidance</span><h2>Not sure which course to choose?</h2><p>Tell us what you want to learn and where you are starting from. We will help you compare the published options.</p></div><div><Link href="/contact" className="public-button">Contact Us <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/admission" className="public-button-line">Admission Enquiry</Link></div></Container>
      </section>
    </>
  );
}
