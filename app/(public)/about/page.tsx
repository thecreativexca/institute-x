import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Blocks, CheckCircle2, Code2, Compass, Eye, FileSpreadsheet, Gamepad2, Handshake, Laptop2, Mail, Megaphone, MonitorPlay, Palette, Phone, ShieldCheck, ShoppingCart, Target, Terminal } from "lucide-react";

import { Container } from "@/components/ui/container";
import { InteriorHero } from "@/components/public/interior-hero";
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

const skillAreas = [
  { icon: Code2, title: "Web development", body: "Build technical foundations and understand how modern websites are created." },
  { icon: Terminal, title: "Programming", body: "Develop logical thinking through code, problem-solving and structured practice." },
  { icon: Palette, title: "Graphic design", body: "Develop visual communication skills through tools, composition and practical outputs." },
  { icon: Megaphone, title: "Digital marketing", body: "Learn the channels and working methods behind modern online promotion." },
  { icon: ShieldCheck, title: "Cyber security", body: "Explore safer digital practices and core security concepts through structured learning." },
  { icon: ShoppingCart, title: "E-commerce", body: "Understand online stores, digital selling and practical commerce workflows." },
  { icon: Handshake, title: "Freelancing", body: "Learn how independent project work is planned, communicated and delivered." },
  { icon: Laptop2, title: "Computer fundamentals", body: "Build confidence with computers, files, internet use and core digital tasks." },
  { icon: FileSpreadsheet, title: "Office skills", body: "Work more confidently with everyday productivity and business tools." },
  { icon: Gamepad2, title: "Game development", body: "Explore interactive thinking, game logic and the building blocks of digital experiences." },
];

const learningJourney = [
  { title: "Learn", body: "Follow clear lessons and understand the foundations." },
  { title: "Practice", body: "Apply each idea through focused tasks and exercises." },
  { title: "Build", body: "Turn practice into projects and demonstrable work." },
  { title: "Grow", body: "Use feedback and continued learning to move forward." },
];

export default async function AboutPage() {
  const courses = await getPublishedCourses();
  const totalModules = courses.reduce((total, course) => total + course.syllabus.length, 0);
  const totalLessons = courses.reduce((total, course) => total + course.syllabus.reduce((sum, module) => sum + module.lessons.length, 0), 0);

  return (
    <>
      <InteriorHero
        kicker={`About ${siteConfig.shortName}`}
        title={<>Skills that prepare you for the <em>real world.</em></>}
        description="Build practical digital, creative and professional skills through structured learning designed to turn understanding into useful ability."
        imageSrc="/images/hero-students-learning.jpg"
        imageAlt="Students learning practical technology skills together"
        imageNote="Learn with direction. Build with purpose."
        actions={[{ label: "Explore Courses", href: "/courses" }, { label: "Contact Us", href: "/contact", variant: "outline" }]}
      />

      <section className="about-story">
        <Container>
          <div className="about-story-grid">
            <div className="about-image-stack" data-reveal>
              <div className="about-image-main">
                <Image src="/images/learning-together.jpg" alt="A student participating in a computer classroom" fill loading="eager" sizes="(max-width: 1024px) 100vw, 44vw" className="object-cover" />
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

      <section className="about-purpose">
        <Container>
          <div className="about-purpose-grid">
            <article data-reveal>
              <Target className="h-6 w-6" aria-hidden="true" />
              <span>Our mission</span>
              <h2>Make useful skills easier to learn and apply.</h2>
              <p>We organise career-focused learning into understandable steps, with practical work that helps learners move from knowing to doing.</p>
            </article>
            <article data-reveal>
              <Eye className="h-6 w-6" aria-hidden="true" />
              <span>Our vision</span>
              <h2>A clearer path from curiosity to capability.</h2>
              <p>We want students from different starting points to see what they can learn, how they can practise it and where that skill can take them next.</p>
            </article>
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

      <section className="about-skills">
        <Container>
          <div className="education-section-heading">
            <div><span className="public-kicker">Skills we focus on</span><h2>Learning shaped around real digital work.</h2></div>
            <p>Course availability changes with the published catalog. These focus areas show the kind of practical, job-relevant capabilities the institute develops.</p>
          </div>
          <div className="about-skills-grid">
            {skillAreas.map(({ icon: Icon, title, body }) => (
              <article key={title} data-reveal><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </Container>
      </section>

      <section className="about-learning-journey">
        <Container>
          <span className="public-kicker">Practical learning approach</span>
          <div className="about-journey-heading"><h2>Learn → Practice → Build → Grow</h2><p>A simple rhythm keeps learning purposeful. Each stage builds on the one before it, so progress feels visible and manageable.</p></div>
          <ol>
            {learningJourney.map((step, index) => (
              <li key={step.title} data-reveal><span>0{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p>{index < learningJourney.length - 1 ? <ArrowRight aria-hidden="true" /> : null}</li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="about-benefits">
        <Container>
          <div className="about-benefits-image" data-reveal><Image src="/images/students-classroom.jpg" alt="Students building practical computer skills in a classroom" fill sizes="(max-width: 1024px) 100vw, 46vw" className="object-cover" /></div>
          <div data-reveal>
            <span className="public-kicker">Built around the learner</span>
            <h2>Support for every stage of the learning journey.</h2>
            <ul>
              {["Course information before admission", "A structured student learning portal", "Progress, resources and submissions in one place", "Clear ways to ask for academic or technical support"].map((benefit) => <li key={benefit}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{benefit}</li>)}
            </ul>
            <Link href="/courses" className="public-button-dark mt-8">Explore courses <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
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
