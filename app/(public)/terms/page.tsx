import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms for using ${siteConfig.name} courses and student services.`,
};

export default function TermsPage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: August 30, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700 sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Accounts and access</h2>
            <p className="mt-2">Keep your login credentials confidential and provide accurate registration information. Course access is personal to the enrolled learner and may not be shared, resold, copied, or used to distribute institute materials.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Courses and assessments</h2>
            <p className="mt-2">Course outlines, schedules, instructors, and learning resources may be updated to maintain quality or reflect current practice. Certificates are issued only when the published completion requirements are met.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Payments</h2>
            <p className="mt-2">Prices and the payable total are shown before payment. Enrollment is activated only after successful provider confirmation, except for courses explicitly marked free. Failed, cancelled, or reversed payments do not create paid access.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Acceptable use</h2>
            <p className="mt-2">Do not attempt unauthorized access, interfere with the platform, upload harmful content, impersonate another person, misuse support channels, or submit work that violates academic integrity rules.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Support and disputes</h2>
            <p className="mt-2">Contact the institute office promptly if access or payment details appear incorrect. We will review platform and provider records before making an enrollment, payment, or certificate decision.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-2">Questions about these terms can be sent to <a className="font-medium text-primary-700 hover:underline" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.</p>
          </section>
        </div>
      </article>
    </Container>
  );
}
