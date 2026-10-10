import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BookOpenCheck, BriefcaseBusiness, CheckCircle2, CircleHelp, Clock3, Laptop, MessagesSquare, MonitorPlay, Route, ShieldCheck, Sparkles, UserRound } from "lucide-react";

import { RequestForm } from "@/components/public/request-form";
import { InteriorHero } from "@/components/public/interior-hero";
import { Container } from "@/components/ui/container";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admission & Course Enquiry",
  description: `Send a course admission enquiry to ${siteConfig.name}. Compare the current catalog and ask about fees, batches and eligibility.`,
};

const steps = [
  { icon: BookOpenCheck, title: "Choose a course", body: "Review the published fee, duration, level and syllabus before deciding." },
  { icon: MessagesSquare, title: "Submit your details", body: "Share a phone number and any question about the course or current batch." },
  { icon: BadgeCheck, title: "Receive confirmation", body: "The admissions team will contact you before any enrollment or payment step." },
  { icon: MonitorPlay, title: "Start learning", body: "Once enrollment is confirmed, use your student account to access the learning experience." },
];

const learningBenefits = [
  { icon: Clock3, title: "Flexible learning", body: "Use the learning mode and schedule available for your selected course." },
  { icon: MonitorPlay, title: "Practical lessons", body: "Move through focused content designed around useful skills." },
  { icon: Route, title: "Structured curriculum", body: "Follow modules and lessons in a clear learning sequence." },
  { icon: Sparkles, title: "Skill-focused training", body: "Build capability in the area you chose to study." },
];

export default async function AdmissionPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const courses = await getPublishedCourses();
  const { course: requestedSlug } = await searchParams;
  const selectedCourse = requestedSlug
    ? courses.find((course) => course.slug === requestedSlug)
    : undefined;
  const courseOptions = courses.map((course) => ({ name: course.name, slug: course.slug }));

  return (
    <>
      <InteriorHero
        kicker="Admission at Creative X Tycoon"
        title={<>Start your learning <em>journey.</em></>}
        description="Explore the current courses, compare what you will learn and send your details when you are ready. The team will guide you through the next step."
        imageSrc="/images/guidance.jpg"
        imageAlt="A learner receiving guidance while working on a laptop"
        imageNote="A clear course choice starts with the right guidance."
        actions={[{ label: "Explore Courses", href: "/courses" }, { label: "Admission Form", href: "#admission-form", variant: "outline" }]}
      />

      <section id="admission-form" className="admission-main">
        <Container>
          <div className="admission-layout">
            <div className="admission-copy" data-reveal>
              <span className="public-kicker">How admission works</span>
              <h2>A simple request, followed by a real conversation.</h2>
              <p>
                This form creates an admission request in the institute portal. It does not take payment or confirm a
                seat automatically.
              </p>
              <ol>
                {steps.map(({ icon: Icon, title, body }, index) => (
                  <li key={title}>
                    <span className="admission-step-icon"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <div><small>Step {index + 1}</small><h3>{title}</h3><p>{body}</p></div>
                  </li>
                ))}
              </ol>
              <div className="admission-assurance">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                <p><strong>No payment on this form.</strong> Review the course and confirm all details with the admissions team first.</p>
              </div>
              <Link href="/courses" className="education-text-link">Compare all courses <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div data-reveal>
              <RequestForm type="enrollment" courses={courseOptions} selectedCourse={selectedCourse ? { name: selectedCourse.name, slug: selectedCourse.slug } : undefined} />
            </div>
          </div>
        </Container>
      </section>

      <section className="admission-audience">
        <Container>
          <div data-reveal>
            <span className="public-kicker">Who can join</span>
            <h2>Learning paths for different starting points.</h2>
            <p>Course level and requirements vary, but the institute welcomes enquiries from people building new digital and professional skills.</p>
            <ul>{["Students", "Beginners", "Job seekers", "Working professionals", "People learning new digital skills"].map((item) => <li key={item}><CheckCircle2 className="h-5 w-5" aria-hidden="true" />{item}</li>)}</ul>
          </div>
          <div className="admission-benefit-grid">
            {learningBenefits.map(({ icon: Icon, title, body }) => <article key={title} data-reveal><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </Container>
      </section>

      <section className="admission-guidance">
        <Container>
          <div className="education-section-heading">
            <div><span className="public-kicker">Course selection guidance</span><h2>Choose for your goal—not just the course title.</h2></div>
            <p>Compare the level, syllabus, duration and requirements on each course page. If two options look similar, send an enquiry and explain what you want to be able to do.</p>
          </div>
          <div className="admission-guidance-grid">
            <article data-reveal><UserRound className="h-6 w-6" aria-hidden="true" /><h3>Start from your current level</h3><p>Use the published course level and requirements to choose a realistic starting point.</p></article>
            <article data-reveal><Laptop className="h-6 w-6" aria-hidden="true" /><h3>Learning modes</h3><p>Available learning modes are shown with the relevant course or confirmed by the admissions team, so you can choose what suits your schedule.</p></article>
            <article data-reveal><BriefcaseBusiness className="h-6 w-6" aria-hidden="true" /><h3>Compare for your goal</h3><p>Look at outcomes, lesson topics, expected starting level and practical work—not only duration or fee.</p></article>
          </div>
        </Container>
      </section>

      <section className="admission-faq-preview">
        <Container>
          <div data-reveal><CircleHelp className="h-7 w-7" aria-hidden="true" /><span className="public-kicker">Before you enquire</span><h2>Useful things to check first.</h2></div>
          <ul data-reveal>
            {["Is the course level right for my current experience?", "What topics and practical work are included?", "What is the current learning mode and schedule?", "What happens after I submit this enquiry?"].map((question) => <li key={question}><CheckCircle2 className="h-5 w-5" aria-hidden="true" /><span>{question}</span></li>)}
          </ul>
          <div className="admission-faq-actions"><Link href="/faq" className="public-button-dark">Read FAQs <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/contact" className="public-button-line">Contact support</Link></div>
        </Container>
      </section>
    </>
  );
}
