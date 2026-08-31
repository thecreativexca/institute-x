import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Mail, MapPin, Phone, Sparkles } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact the institute office for admissions and enquiries.",
};

export default function ContactPage() {
  const contactCards = [
    {
      icon: Phone,
      label: "Call us",
      value: siteConfig.contact.phone,
      description: "Speak directly with the institute office.",
      href: siteConfig.contact.phoneHref,
    },
    {
      icon: Mail,
      label: "Email us",
      value: siteConfig.contact.email,
      description: "Send your course or admission enquiry.",
      href: `mailto:${siteConfig.contact.email}`,
    },
    {
      icon: MapPin,
      label: "Visit us",
      value: siteConfig.contact.address,
      description: "Meet the team at the institute office.",
    },
  ];

  return (
    <>
      <section className="public-hero-pattern relative overflow-hidden border-b border-primary-100">
        <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-40" />
        <Container className="relative py-16 text-center sm:py-20 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-primary-900">
            <Sparkles className="h-4 w-4 text-primary-700" aria-hidden="true" />
            We are here to help
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold tracking-[-0.035em] text-primary-950 sm:text-5xl lg:text-6xl">
            Let&rsquo;s find the right course for you.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Contact the institute office for admissions, course guidance, fees or any other enquiry.
          </p>
        </Container>
      </section>

      <section className="bg-[#fffef8]">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
            {contactCards.map(({ icon: Icon, label, value, description, href }, index) => {
              const content = (
                <>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-3xl font-bold text-accent-300">0{index + 1}</span>
                  </div>
                  <h2 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-primary-700">{label}</h2>
                  <p className="mt-2 break-words text-lg font-semibold leading-7 text-primary-950">{value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                  {href ? (
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
                      Get in touch <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </>
              );

              return href ? (
                <a key={label} href={href} className="group rounded-2xl border border-primary-100 bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover">
                  {content}
                </a>
              ) : (
                <div key={label} className="rounded-2xl border border-primary-100 bg-white p-6 shadow-card">
                  {content}
                </div>
              );
            })}
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl overflow-hidden rounded-[2rem] border border-primary-200 bg-primary-950 shadow-card-hover lg:grid-cols-[1fr_0.8fr]">
            <div className="p-8 text-white sm:p-10 lg:p-12">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-800 text-accent-300">
                <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">Not sure which course to choose?</h2>
              <p className="mt-4 max-w-xl leading-7 text-primary-100">
                Tell our office what you want to learn and where you are starting from. We will help you explore the most relevant options in the catalog.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={siteConfig.contact.phoneHref} className="inline-flex h-12 items-center justify-center rounded-xl bg-accent-300 px-6 text-base font-semibold text-primary-950 transition-colors hover:bg-accent-400">
                  Call the office
                </a>
                <Link href="/courses" className={buttonVariants("outline", "lg", "rounded-xl border-primary-700 bg-transparent text-white hover:border-primary-500 hover:bg-primary-900")}>
                  Browse courses
                </Link>
              </div>
            </div>
            <div className="public-soft-grid flex min-h-64 items-center justify-center bg-accent-100 p-8">
              <div className="w-full max-w-xs rounded-3xl border border-accent-300 bg-[#fffef8] p-6 text-center shadow-card">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-700">Admission support</p>
                <p className="mt-3 text-2xl font-semibold text-primary-950">One clear conversation can make the next step easier.</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">Keep the course name ready for faster assistance.</p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
