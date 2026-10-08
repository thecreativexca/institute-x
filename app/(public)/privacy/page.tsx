import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles account, learning, and payment information.`,
};

export default function PrivacyPolicyPage() {
  return (
    <Container className="legal-page">
      <article className="legal-article">
        <p className="public-kicker">Legal</p>
        <h1>Privacy Policy</h1>
        <p className="mt-4 text-sm text-slate-500">Last updated: August 30, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700 sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
            <p className="mt-2">We collect information needed to create and secure your account, process enrollments, deliver courses, record learning progress, issue certificates, and respond to support requests. This may include your name, email address, phone number, course activity, assessment results, and transaction references.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">How information is used</h2>
            <p className="mt-2">Information is used only to operate the institute platform, communicate important account or course updates, prevent misuse, meet record-keeping obligations, and improve learner support. We do not sell personal information.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Payments and supporting records</h2>
            <p className="mt-2">Payments are collected by the institute outside the website and recorded by authorised administrators. We store transaction references, optional proof files and verification status, but the platform does not store complete card or banking credentials. Trusted infrastructure, email and file-storage services process limited data on our behalf.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Security and retention</h2>
            <p className="mt-2">We use access controls, restricted staff roles, secure password hashing, and protected sessions. Records are retained only as long as required for learning delivery, legal obligations, dispute handling, and legitimate institute operations.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Your choices</h2>
            <p className="mt-2">You may ask the institute office to review or correct your account information. Requests involving deletion may be limited where academic, payment, legal, or fraud-prevention records must be retained.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
            <p className="mt-2">For privacy questions, email <a className="font-medium text-primary-700 hover:underline" href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.</p>
          </section>
        </div>
      </article>
    </Container>
  );
}
