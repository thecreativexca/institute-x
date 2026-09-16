"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  HelpCircle,
  BookOpen,
  CreditCard,
  Award,
  Laptop,
  UserCircle,
  MessageSquare,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const faqCategories = [
  {
    id: "courses",
    label: "Courses & Learning",
    icon: BookOpen,
    questions: [
      {
        q: "What courses does Creative X Tycoon offer?",
        a: "We offer a wide range of career-focused programs including Computer Fundamentals, Microsoft Office, Tally Prime & Accounting, Graphic Design, Web Development, Digital Marketing, and Healthcare Management. Visit our Courses page for the full catalogue.",
      },
      {
        q: "Are the courses available online or only offline?",
        a: "Our primary mode of delivery is offline, hands-on lab sessions at our campus. Recorded study materials and resources are made available through the student portal for revision.",
      },
      {
        q: "How long does each course take to complete?",
        a: "Course durations vary from 1 month to 6 months depending on the program. Each course page lists the exact duration, batch schedule, and total classroom hours.",
      },
      {
        q: "Can I enrol in multiple courses at the same time?",
        a: "Yes. You may enrol in multiple courses as long as the class schedules do not conflict. Speak to our admissions team who will help you plan a suitable timetable.",
      },
      {
        q: "What happens if I miss a class?",
        a: "You can attend a make-up session in another batch for the same course (subject to seat availability) or access the supplementary study material in your student portal. Contact our support team to arrange a missed-session catch-up.",
      },
    ],
  },
  {
    id: "admission",
    label: "Admission & Enrolment",
    icon: UserCircle,
    questions: [
      {
        q: "Who can enrol at Creative X Tycoon?",
        a: "Anyone aged 16 and above can enrol — whether you are a school student, college student, working professional, or a homemaker looking to upskill. No prior technical knowledge is required for most of our beginner programs.",
      },
      {
        q: "How do I register for a course?",
        a: "You can register online through our Courses page by selecting a program and completing the enrolment form, or visit our campus directly. Our admissions team will guide you through the process.",
      },
      {
        q: "Is there an entrance test or interview for admission?",
        a: "No entrance exam is required for our standard programs. Some advanced and specialised programs may have a brief counselling session to assess your background and recommend the most suitable batch.",
      },
      {
        q: "What documents do I need to submit at the time of admission?",
        a: "You will need a valid photo ID (Aadhar Card, School/College ID, or Passport), one recent passport-size photograph, and proof of your last qualification (marksheet or certificate). Original documents are required only for verification.",
      },
    ],
  },
  {
    id: "fees",
    label: "Fees & Payments",
    icon: CreditCard,
    questions: [
      {
        q: "What are the fee payment options?",
        a: "We accept payments via UPI, Net Banking, Debit/Credit Card, and cash at the campus counter. Online payments can be made directly from your student portal under the Payments section.",
      },
      {
        q: "Can I pay fees in instalments?",
        a: "Yes. For select programs we offer an Easy Instalment Plan (EIP). The instalment schedule and applicable eligibility criteria are displayed on the course enrolment page. Contact our admissions team for details.",
      },
      {
        q: "Is there a refund policy if I withdraw from a course?",
        a: "Yes, we have a transparent refund policy. Refund eligibility depends on the number of classes attended and the time elapsed since enrolment. Please read our Refund Policy page or contact support for the specific terms applicable to your course.",
      },
      {
        q: "Are there any scholarships or discounts available?",
        a: "We periodically offer early-bird discounts, group enrolment discounts, and merit-based fee concessions. Follow our announcements or speak to our admissions team to learn about current offers.",
      },
    ],
  },
  {
    id: "certificates",
    label: "Certificates",
    icon: Award,
    questions: [
      {
        q: "Will I receive a certificate after completing a course?",
        a: `Yes. All students who successfully complete a course and meet the attendance and assessment requirements receive a digitally verifiable Certificate of Completion issued by ${siteConfig.name}.`,
      },
      {
        q: "How can I verify my certificate?",
        a: "Every certificate carries a unique certificate ID and a QR code. Employers or institutions can verify the authenticity of your certificate instantly by visiting our verification portal at /verify-certificate and entering the certificate number.",
      },
      {
        q: "When will I receive my certificate?",
        a: "Certificates are generated within 7–10 working days of successfully completing your course and clearing all pending assessments. You will be notified via email and the student portal when it is ready to download.",
      },
      {
        q: "What if I lose my certificate?",
        a: "You can re-download your certificate at any time from the Certificates section of your student portal — there is no expiry on your access to issued certificates.",
      },
    ],
  },
  {
    id: "technical",
    label: "Portal & Technical",
    icon: Laptop,
    questions: [
      {
        q: "I forgot my portal password. How do I reset it?",
        a: "Click the 'Forgot password?' link on the login page and enter your registered email address. A password reset link will be sent to your inbox within a few minutes. Check your spam folder if you do not see it.",
      },
      {
        q: "My course content is not loading. What should I do?",
        a: "Try clearing your browser cache and refreshing the page. If the issue persists, try a different browser or device. If it still does not work, raise a support ticket from the Support section of your portal with a description of the issue and your device/browser details.",
      },
      {
        q: "Can I access the student portal on my mobile phone?",
        a: "Yes. The student portal is fully responsive and works on all modern smartphones and tablets. Use any recent version of Chrome, Safari, Firefox, or Edge for the best experience.",
      },
      {
        q: "How do I update my profile information or contact details?",
        a: "Log in to your student portal, navigate to the Profile section, and update your details there. For changes to your registered mobile number or email address, please contact our support team for verification.",
      },
    ],
  },
];

// ─── Accordion Item ────────────────────────────────────────────────────────────

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
  itemId,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
}) {
  return (
    <div
      className={cn(
        "border rounded-xl overflow-hidden transition-all duration-200",
        isOpen
          ? "border-primary-200 bg-primary-50/60 shadow-sm"
          : "border-slate-200 bg-white hover:border-primary-100 hover:bg-slate-50/80"
      )}
    >
      <button
        id={`faq-btn-${itemId}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${itemId}`}
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <span
          className={cn(
            "text-sm sm:text-base font-medium leading-snug transition-colors",
            isOpen ? "text-primary-900" : "text-slate-800"
          )}
        >
          {question}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 mt-0.5 transition-transform duration-300",
            isOpen ? "rotate-180 text-primary-600" : "text-slate-400"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        id={`faq-panel-${itemId}`}
        role="region"
        aria-labelledby={`faq-btn-${itemId}`}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="px-5 pb-5 text-sm sm:text-base leading-relaxed text-slate-600">
          {answer}
        </p>
      </div>
    </div>
  );
}

// ─── FAQ Client ────────────────────────────────────────────────────────────────

export function FAQClient() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState(faqCategories[0].id);

  const toggle = (key: string) =>
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }));

  const activeData = faqCategories.find((c) => c.id === activeCategory)!;

  return (
    <>
      {/* ── Hero ── */}
      <section className="public-hero-pattern relative overflow-hidden border-b border-primary-100 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />
        <Container className="relative py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">
            <HelpCircle className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
            Help Centre
          </span>

          <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-[-0.03em] text-primary-950 sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
            Answers to the most common questions about our courses, admissions, fees, certificates, and portal. Can&apos;t find what you&apos;re looking for?{" "}
            <Link
              href="/contact"
              className="font-medium text-primary-700 underline underline-offset-4 hover:text-primary-900"
            >
              Contact us
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* ── FAQ Body ── */}
      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="mx-auto max-w-4xl">

            {/* Category Tabs */}
            <div className="mb-10 flex flex-wrap gap-2 justify-center">
              {faqCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setOpenItems({});
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-all duration-150",
                      activeCategory === cat.id
                        ? "bg-primary-700 text-white border-primary-700 shadow-md"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:text-primary-800 hover:bg-primary-50"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Questions Accordion */}
            <div className="space-y-3">
              {activeData.questions.map((item, idx) => {
                const key = `${activeCategory}-${idx}`;
                return (
                  <AccordionItem
                    key={key}
                    itemId={key}
                    question={item.q}
                    answer={item.a}
                    isOpen={!!openItems[key]}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>

            {/* CTA Banner */}
            <div className="mt-14 rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-accent-50 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <MessageSquare className="h-6 w-6 text-primary-700" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold text-primary-950">Still have questions?</h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto">
                Our team is happy to help. Raise a support ticket from your student portal or send us a message directly.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contact"
                  className={buttonVariants("primary", "md", "rounded-xl font-semibold shadow-md")}
                >
                  Contact Us
                </Link>
                <Link
                  href="/student/support"
                  className={buttonVariants(
                    "outline",
                    "md",
                    "rounded-xl border-primary-200 bg-white font-semibold"
                  )}
                >
                  Open a Support Ticket
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
