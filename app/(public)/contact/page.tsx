import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail, MessageCircle } from "lucide-react";

import { AdmissionEnquiryForm } from "@/components/public/admission-enquiry-form";
import { Container } from "@/components/ui/container";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Course Guidance",
  description: `Contact ${siteConfig.name} for help choosing a course, understanding a syllabus or resolving an enrollment question.`,
};

export default async function ContactPage() {
  const courses = await getPublishedCourses();
  return (
    <>
      <section className="public-page-hero">
        <Container>
          <div className="public-page-hero-grid">
            <div data-reveal>
              <span className="public-kicker">Course guidance & support</span>
              <h1 className="public-page-title mt-8">Let&apos;s make the next step <em>clear.</em></h1>
            </div>
            <p className="public-page-intro" data-reveal>
              Ask about a syllabus, fee, course requirement or student account. A little context helps us point you
              in the right direction.
            </p>
          </div>
        </Container>
      </section>

      <section>
        <Container>
          <div className="contact-layout">
            <aside className="contact-aside" data-reveal>
              <span className="public-kicker">Start a conversation</span>
              <h2 className="mt-7">A useful answer starts with your goal.</h2>
              <p>
                Tell us what you want to learn, where you are starting from and what you need to decide. For an
                existing enrollment, include the course name and the email used for your account.
              </p>
              <div className="contact-direct">
                <a href={`mailto:${siteConfig.contact.email}`}>
                  <span className="inline-flex items-center gap-3"><Mail className="h-5 w-5" aria-hidden="true" />{siteConfig.contact.email}</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                  <a href={siteConfig.contact.phoneHref}>
                    <span className="inline-flex items-center gap-3"><MessageCircle className="h-5 w-5" aria-hidden="true" />{siteConfig.contact.phone}</span>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
              </div>
              <Link href="/faq" className="public-button-line mt-8">Read common questions</Link>
            </aside>
            <div data-reveal>
              <AdmissionEnquiryForm courses={courses.map((course) => ({ name: course.name, slug: course.slug }))} />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
