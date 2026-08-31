import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Refund request terms for ${siteConfig.name} course purchases.`,
};

export default function RefundPolicyPage() {
  return (
    <Container className="py-14 sm:py-20">
      <article className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">Legal</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Refund Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: August 30, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700 sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Request window</h2>
            <p className="mt-2">Eligible paid-course refund requests must be submitted to the institute office within 30 calendar days of the confirmed payment date. Free courses are not eligible for a monetary refund.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Eligibility review</h2>
            <p className="mt-2">Requests are reviewed against enrollment activity, downloaded resources, completed assessments, issued certificates, discounts, and any exceptional terms shown at purchase. A certificate already issued for the course makes the purchase ineligible for refund.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Processing</h2>
            <p className="mt-2">Approved refunds are returned through the original payment method where possible. Bank and payment-provider processing times may apply after the institute approves the request.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">How to request a refund</h2>
            <p className="mt-2">Email <a className="font-medium text-primary-700 hover:underline" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a> with your registered email address, course name, transaction reference, and reason for the request. Do not email card, bank-password, PIN, or OTP details.</p>
          </section>
        </div>
      </article>
    </Container>
  );
}
