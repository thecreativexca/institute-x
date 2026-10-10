import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, BriefcaseBusiness, HelpCircle, LifeBuoy, Mail, MessageCircle, UserRoundPlus } from "lucide-react";

import { AdmissionEnquiryForm } from "@/components/public/admission-enquiry-form";
import { InteriorHero } from "@/components/public/interior-hero";
import { Container } from "@/components/ui/container";
import { getPublishedCourses } from "@/lib/catalog/public-courses";
import { siteConfig } from "@/lib/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & Course Guidance",
  description: `Contact ${siteConfig.name} for help choosing a course, understanding a syllabus or resolving an enrollment question.`,
};

const contactReasons = [
  { icon: BookOpenCheck, title: "Course enquiry", body: "Compare course levels, syllabus details and learning goals." },
  { icon: UserRoundPlus, title: "Admission enquiry", body: "Ask about the current admission process and next steps." },
  { icon: BriefcaseBusiness, title: "Internship enquiry", body: "Check active pathways, domains and eligibility information." },
  { icon: LifeBuoy, title: "Technical support", body: "Get help with account access, lessons, resources or the portal." },
  { icon: HelpCircle, title: "General questions", body: "Ask something that does not fit the other enquiry types." },
];

export default async function ContactPage() {
  const courses = await getPublishedCourses();
  return (
    <>
      <InteriorHero
        kicker="Course guidance & support"
        title={<>Have questions? We&apos;re here to <em>help.</em></>}
        description="Ask about a syllabus, admission, internship opportunity or student account. A little context helps us point you in the right direction."
        imageSrc="/images/online-learning.jpg"
        imageAlt="Student receiving online learning support at a desk"
        imageNote="Clear answers for your next learning decision."
        actions={[{ label: "Send a Message", href: "#contact-form" }, { label: "Read FAQs", href: "/faq", variant: "outline" }]}
      />

      <section className="contact-reasons">
        <Container>
          <div className="education-section-heading"><div><span className="public-kicker">How can we help?</span><h2>Send your question to the right place.</h2></div><p>Choose the closest reason in the form and include enough context for the team to understand what you need.</p></div>
          <div className="contact-reason-grid">
            {contactReasons.map(({ icon: Icon, title, body }) => <article key={title} data-reveal><Icon className="h-6 w-6" aria-hidden="true" /><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </Container>
      </section>

      <section id="contact-form">
        <Container>
          <div className="contact-layout">
            <aside className="contact-aside" data-reveal>
              <span className="public-kicker">Start a conversation</span>
              <h2 className="mt-7">A useful answer starts with your goal.</h2>
              <p>
                Tell us what you want to learn, where you are starting from and what you need to decide. For an
                existing enrollment, include the course name and the email used for your account.
              </p>
              <div className="contact-response-note"><LifeBuoy className="h-5 w-5" aria-hidden="true" /><p>For a signed-in student issue, the portal Support area helps keep your request linked to your account.</p></div>
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

      <section className="contact-support-cta">
        <Container><div data-reveal><span className="public-kicker">More ways to find help</span><h2>Start with the answer you need.</h2><p>Browse common questions for quick guidance, or sign in to use student support for an issue connected to your account.</p></div><div><Link href="/faq" className="public-button-dark">Browse FAQs <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/student/support" className="public-button-line">Student Support</Link></div></Container>
      </section>
    </>
  );
}
