import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, BookOpenCheck, MessagesSquare, ShieldCheck } from "lucide-react";

import { RequestForm } from "@/components/public/request-form";
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
  { icon: MessagesSquare, title: "Send your enquiry", body: "Share a phone number and any question about the course or current batch." },
  { icon: BadgeCheck, title: "Confirm the details", body: "The admissions team will contact you before any enrollment or payment step." },
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
      <section className="public-page-hero admission-hero">
        <Container>
          <div className="public-page-hero-grid">
            <div data-reveal>
              <span className="public-kicker">Admission enquiry</span>
              <h1 className="public-page-title mt-8">Take the next step <em>with clarity.</em></h1>
            </div>
            <p className="public-page-intro" data-reveal>
              Choose a published course and send an enquiry. The institute will confirm the current batch, fee and
              next steps before you enroll.
            </p>
          </div>
        </Container>
      </section>

      <section className="admission-main">
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
    </>
  );
}
