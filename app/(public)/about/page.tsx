import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Blocks, Compass, Mail, MonitorPlay, Phone, ShieldCheck } from "lucide-react";

import { Container } from "@/components/ui/container";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Our Learning Approach",
  description: `See how ${siteConfig.name} turns practical digital and professional skills into clear learning paths.`,
};

const principles = [
  { icon: Compass, title: "Direction before decoration", body: "Every course states its outcomes, audience, requirements and sequence before asking you to enroll." },
  { icon: Blocks, title: "Structure that reduces friction", body: "Modules group related ideas and lessons keep each step focused enough to finish." },
  { icon: MonitorPlay, title: "A portal built around learning", body: "Course access, progress, submissions and support stay connected in one student space." },
  { icon: ShieldCheck, title: "Clarity at every decision", body: "Duration, fee, curriculum and requirements are visible before you request admission." },
];

export default async function AboutPage() {
  const courses = await getPublishedCourses();
  const totalModules = courses.reduce((total, course) => total + course.syllabus.length, 0);
  const totalLessons = courses.reduce((total, course) => total + course.syllabus.reduce((sum, module) => sum + module.lessons.length, 0), 0);

  return (
    <>
      <section className="public-page-hero">
        <Container>
          <div className="public-page-hero-grid">
            <div data-reveal>
              <span className="public-kicker">About {siteConfig.shortName}</span>
              <h1 className="public-page-title mt-8">Learning with <em>direction.</em></h1>
            </div>
            <p className="public-page-intro" data-reveal>
              We make career, digital and creative learning easier to navigate—from choosing the right course to
              submitting an admission request and completing each lesson.
            </p>
          </div>
        </Container>
      </section>

      <section className="about-story">
        <Container>
          <div className="about-story-grid">
            <div className="about-image-stack" data-reveal>
              <div className="about-image-main">
                <Image src="/images/learning-together.jpg" alt="A student participating in a computer classroom" fill sizes="(max-width: 1024px) 100vw, 44vw" className="object-cover" />
              </div>
              <div className="about-image-secondary">
                <Image src="/images/student-collaboration.jpg" alt="Students learning together around a laptop" fill sizes="(max-width: 768px) 46vw, 20vw" className="object-cover" />
              </div>
            </div>
            <div className="about-story-copy" data-reveal>
              <span className="public-kicker">The idea</span>
              <h2 className="mt-7">Practical learning should feel ambitious, not overwhelming.</h2>
              <p>{siteConfig.name} brings professional skills into one organised experience. Every published course shows its fee, duration, level and syllabus before you request admission, so there are fewer surprises and better decisions.</p>
              <div className="about-stats">
                <div className="about-stat"><strong>{courses.length}</strong><span>Published courses</span></div>
                <div className="about-stat"><strong>{totalModules}</strong><span>Course modules</span></div>
                <div className="about-stat"><strong>{totalLessons}</strong><span>Lessons available</span></div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="method-section">
        <Container className="py-20 sm:py-28">
          <div className="method-grid">
            <div data-reveal>
              <span className="public-kicker !text-primary-950">Our principles</span>
              <h2 className="method-title mt-7">Clear by <em>design.</em></h2>
              <Link href="/courses" className="public-button-dark mt-9">Explore courses <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <ol className="method-list" data-reveal>
              {principles.map(({ icon: Icon, title, body }, index) => (
                <li key={title} className="method-item">
                  <span className="method-number">0{index + 1}</span>
                  <div><h3>{title}</h3><p>{body}</p></div>
                  <span className="method-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>

      <section className="about-contact-band">
        <Container>
          <div>
            <span className="public-kicker">Admissions support</span>
            <h2>Still deciding what to learn?</h2>
            <p>Share your goal with us. We will help you shortlist a suitable course and explain the admission process.</p>
          </div>
          <div className="about-contact-actions">
            <a href={siteConfig.contact.phoneHref} className="public-button"><Phone className="h-4 w-4" aria-hidden="true" /> {siteConfig.contact.phone}</a>
            <a href={`mailto:${siteConfig.contact.email}`} className="public-button-line"><Mail className="h-4 w-4" aria-hidden="true" /> Email us</a>
          </div>
        </Container>
      </section>
    </>
  );
}
