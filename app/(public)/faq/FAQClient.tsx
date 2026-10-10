"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, BriefcaseBusiness, ChevronDown, CircleUserRound, CreditCard, GraduationCap, HelpCircle, Laptop, MessageSquare, UserRoundPlus } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils/cn";

const faqCategories = [
  { id: "courses", label: "Courses", icon: BookOpen, questions: [
    { q: "Where can I see the current course list?", a: "The Courses page shows the programs currently published by the institute. Each course page includes its available description, level, duration, fee and syllabus information." },
    { q: "How do I choose the right course?", a: "Start with the skill you want to build, then compare the course level, syllabus and requirements. If you are still unsure, contact the team with your current experience and learning goal." },
  ] },
  { id: "admission", label: "Admission", icon: UserRoundPlus, questions: [
    { q: "How do I send an admission enquiry?", a: "Choose a course and use the admission form to submit your details. The form creates an enquiry; the team confirms current batch information and next steps separately." },
    { q: "Does submitting the form confirm my admission?", a: "No. An enquiry does not automatically confirm enrollment, a seat or payment. The admissions team will review the request and contact you with the applicable details." },
  ] },
  { id: "learning", label: "Learning", icon: GraduationCap, questions: [
    { q: "Where do enrolled students access lessons?", a: "Enrolled students use the student portal to open available courses, lessons, resources, assignments and progress information linked to their account." },
    { q: "Are all courses delivered in the same learning mode?", a: "Learning mode can vary by course. Check the published course information and confirm current delivery details with the admissions team before enrolling." },
  ] },
  { id: "payments", label: "Payments", icon: CreditCard, questions: [
    { q: "Where can I confirm the current course fee?", a: "Use the fee shown on the published course page and confirm it with the admissions team before paying. Any payment options or schedules that apply will be explained for that enrollment." },
    { q: "Where can I read the refund terms?", a: "The website has a dedicated Refund Policy page. Read the current policy before making a payment, and contact support if you need help understanding how it applies to your case." },
  ] },
  { id: "account", label: "Account", icon: CircleUserRound, questions: [
    { q: "What should I do if I forget my password?", a: "Use the Forgot password link on the relevant login page and follow the verification steps. If you cannot complete the reset, contact technical support." },
    { q: "How do I update my student details?", a: "Open Profile in the student portal for the fields available to edit. Contact support when a protected account detail requires verification." },
  ] },
  { id: "internship", label: "Internship", icon: BriefcaseBusiness, questions: [
    { q: "Who can apply for an internship pathway?", a: "Eligibility depends on the active opportunity, its domain and any required course progress. Signed-in students can review available opportunities in the student portal." },
    { q: "Does an internship pathway guarantee a job?", a: "No. Internship pathways are intended to provide structured practice, projects and feedback. They do not guarantee employment or a particular career outcome." },
  ] },
  { id: "technical", label: "Technical Support", icon: Laptop, questions: [
    { q: "A lesson or resource is not loading. What should I do?", a: "Refresh the page and try a current browser. For a YouTube lesson that cannot play inside the site, use its Watch on YouTube link. If the problem continues, send support the course, lesson and browser details." },
    { q: "How do I report an account or portal issue?", a: "Signed-in students can use the Support area in the portal. You can also use the public Contact page and choose technical support as the reason for contacting the institute." },
  ] },
];

function AccordionItem({ question, answer, isOpen, onToggle, itemId }: { question: string; answer: string; isOpen: boolean; onToggle: () => void; itemId: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border transition-all duration-200", isOpen ? "border-primary-200 bg-primary-50/60 shadow-sm" : "border-slate-200 bg-white hover:border-primary-100 hover:bg-slate-50/80")}>
      <button id={`faq-btn-${itemId}`} type="button" aria-expanded={isOpen} aria-controls={`faq-panel-${itemId}`} onClick={onToggle} className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left">
        <span className={cn("text-sm font-medium leading-snug transition-colors sm:text-base", isOpen ? "text-primary-900" : "text-slate-800")}>{question}</span>
        <ChevronDown className={cn("mt-0.5 h-5 w-5 shrink-0 transition-transform duration-300", isOpen ? "rotate-180 text-primary-600" : "text-slate-400")} aria-hidden="true" />
      </button>
      <div id={`faq-panel-${itemId}`} role="region" aria-labelledby={`faq-btn-${itemId}`} aria-hidden={!isOpen} className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:text-base">{answer}</p></div>
      </div>
    </div>
  );
}

export function FAQClient() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  return (
    <>
      <section className="public-page-hero">
        <Container><div className="public-page-hero-grid">
          <div data-reveal><span className="public-kicker"><HelpCircle className="h-3.5 w-3.5" aria-hidden="true" /> Help centre</span><h1 className="public-page-title mt-8">Questions, <em>answered.</em></h1></div>
          <p className="public-page-intro" data-reveal>Clear guidance about courses, admission, learning, payments, accounts, internships and technical support. For a situation specific to you, <Link href="/contact" className="font-medium text-primary-700 underline underline-offset-4 hover:text-primary-900">contact us</Link>.</p>
        </div></Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container><div className="mx-auto max-w-4xl">
          <nav aria-label="FAQ categories" className="mb-12 flex flex-wrap justify-start gap-2 border-b border-primary-300 pb-6">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return <a key={category.id} href={`#faq-${category.id}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all duration-150 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"><Icon className="h-4 w-4" aria-hidden="true" />{category.label}</a>;
            })}
          </nav>
          <div className="space-y-12">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return <section key={category.id} id={`faq-${category.id}`} className="scroll-mt-28"><div className="mb-5 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-100 text-primary-700"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-accent-600">FAQ category</p><h2 className="mt-0.5 text-2xl font-bold text-primary-950">{category.label}</h2></div></div><div className="space-y-3">{category.questions.map((item, index) => { const key = `${category.id}-${index}`; return <AccordionItem key={key} itemId={key} question={item.q} answer={item.a} isOpen={Boolean(openItems[key])} onToggle={() => setOpenItems((current) => ({ ...current, [key]: !current[key] }))} />; })}</div></section>;
            })}
          </div>
          <div className="mt-16 border-y border-primary-950 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100"><MessageSquare className="h-6 w-6 text-primary-700" aria-hidden="true" /></div>
            <h2 className="text-xl font-bold text-primary-950">Still have questions?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 sm:text-base">Send the team a message, or use the student support area if your question is about an existing enrollment.</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/contact" className={buttonVariants("primary", "md", "rounded-xl font-semibold shadow-md")}>Contact Us</Link><Link href="/student/support" className={buttonVariants("outline", "md", "rounded-xl border-primary-200 bg-white font-semibold")}>Student Support</Link></div>
          </div>
        </div></Container>
      </section>
    </>
  );
}
