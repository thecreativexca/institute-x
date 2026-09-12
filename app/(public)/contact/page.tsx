import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Container } from "@/components/ui/container";
import { AdmissionEnquiryForm } from "@/components/public/admission-enquiry-form";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact Admissions & Campus Office",
  description:
    "Contact Creative X Tycoon Institute office for course enquiries, admissions, fee structure, campus visits, and free demo classes.",
};

const admissionFaqs = [
  {
    q: "Can I attend a free demo class before enrolling?",
    a: "Yes! We encourage prospective students to attend a free 1-day demo session to experience the practical classroom atmosphere and interact with our faculty.",
  },
  {
    q: "What are the installment and fee payment options?",
    a: "We offer flexible 2 to 3 installment plans for all multi-month diploma and certification programs. We also accept UPI, debit/credit cards, and net banking.",
  },
  {
    q: "Do working professionals have weekend batch options?",
    a: "Yes, we run dedicated Saturday and Sunday morning & evening batches specifically designed for college students and working professionals.",
  },
  {
    q: "When do I receive my verified completion certificate?",
    a: "Certificates with permanent online QR verification are issued within 7 days of completing the final practical project evaluation and module tests.",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero Header */}
      <section className="public-hero-pattern relative overflow-hidden border-b border-primary-100 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />
        <Container className="relative py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">
            <Sparkles className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
            Admissions & Student Helpdesk
          </span>
          <h1 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-extrabold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-6xl">
            Get in Touch With Our Academic Team.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
            Have questions about course curriculum, batch schedules, fees, or career prospects?
            Speak directly with our academic counselors or visit our campus.
          </p>
        </Container>
      </section>

      {/* Main Interactive Section: Form + Contact Cards */}
      <section className="bg-white py-14 sm:py-20">
        <Container>
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] items-start">
            {/* Left Column: Interactive Enquiry Form */}
            <div>
              <AdmissionEnquiryForm />
            </div>

            {/* Right Column: Campus Details, Timings & Quick Helpline */}
            <div className="space-y-6">
              {/* Direct Channels Card */}
              <div className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50/70 to-white p-6 sm:p-8 shadow-card">
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">
                  Institute Contact Desk
                </h2>
                <h3 className="mt-2 text-2xl font-bold text-primary-950">Direct Communication</h3>

                <div className="mt-6 space-y-5">
                  {/* Phone */}
                  <a
                    href={siteConfig.contact.phoneHref}
                    className="flex items-start gap-4 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-card"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                      <Phone className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admission Hotline</p>
                      <p className="text-base font-bold text-primary-950 mt-0.5">{siteConfig.contact.phone}</p>
                      <p className="text-xs text-primary-700 font-medium mt-1">Tap to call our counseling team</p>
                    </div>
                  </a>

                  {/* Email */}
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="flex items-start gap-4 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm transition-all hover:border-primary-300 hover:shadow-card"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                      <Mail className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Official Email</p>
                      <p className="text-base font-bold text-primary-950 mt-0.5 break-all">{siteConfig.contact.email}</p>
                      <p className="text-xs text-primary-700 font-medium mt-1">For syllabus & corporate tie-ups</p>
                    </div>
                  </a>

                  {/* Address */}
                  <div className="flex items-start gap-4 rounded-2xl border border-primary-100 bg-white p-4 shadow-sm">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
                      <MapPin className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus Center Location</p>
                      <p className="text-sm font-bold text-primary-950 mt-0.5">{siteConfig.contact.address}</p>
                      <p className="text-xs text-slate-500 mt-1">Near Metro Station / Bus Terminal</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Working Hours Card */}
              <div className="rounded-3xl border border-primary-100 bg-white p-6 sm:p-7 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-100 text-primary-900">
                    <Clock className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold text-base text-primary-950">Office & Visiting Hours</h3>
                    <p className="text-xs text-slate-500">Center open for admissions and demo classes</p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 text-xs text-slate-700 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-950">Monday – Saturday</span>
                    <span className="font-bold text-emerald-700">8:30 AM – 7:30 PM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-primary-950">Sunday</span>
                    <span className="font-bold text-primary-800">10:00 AM – 2:00 PM (Admissions Only)</span>
                  </div>
                </div>
              </div>

              {/* Quick WhatsApp Assistance */}
              <a
                href={`https://wa.me/${siteConfig.contact.phone.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl bg-emerald-600 px-6 py-4 text-white shadow-md hover:bg-emerald-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-6 w-6" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold">Chat on WhatsApp</p>
                    <p className="text-xs text-emerald-100">Get instant fee structure & course PDF</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Campus Facility Photo Showcase Card */}
          <div className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-[2rem] border border-primary-200 bg-white shadow-card-hover">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative aspect-[16/10] lg:aspect-auto min-h-72 w-full">
                <Image
                  src="/images/campus-reception.jpg"
                  alt="Creative X Tycoon Institute Campus Front Desk"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="p-8 sm:p-10 flex flex-col justify-center bg-gradient-to-br from-primary-950 to-primary-900 text-white">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-300">
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  Authorized Training Center
                </span>
                <h3 className="mt-3 text-2xl sm:text-3xl font-bold">
                  Visit Our Central Campus For Free Career Counseling
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-primary-100">
                  Walk in today to inspect our high-speed computer labs, review sample course projects created by current students, and speak with faculty mentors.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-medium text-accent-200">
                  <span>✓ Free Study Material</span>
                  <span>✓ Dedicated Practice Systems</span>
                  <span>✓ WiFi Campus</span>
                </div>
              </div>
            </div>
          </div>

          {/* Admission FAQs */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary-700">
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Frequently Asked Questions
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-primary-950">
                Common Admission Questions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {admissionFaqs.map((faq) => (
                <div key={faq.q} className="rounded-2xl border border-primary-100 bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-primary-950 flex items-start gap-2">
                    <span className="text-primary-700 font-extrabold">Q.</span>
                    {faq.q}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 pl-4">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
