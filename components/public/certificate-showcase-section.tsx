import Image from "next/image";
import Link from "next/link";
import { Award, CheckCircle2, QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";

/**
 * Certificate Showcase Section — showcases the official verifiable diploma
 * certificate that students earn upon course completion.
 */
export function CertificateShowcaseSection() {
  return (
    <section className="border-t border-primary-100 bg-gradient-to-b from-primary-50/60 to-white py-16 sm:py-24">
      <Container>
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left Column: Image Showcase */}
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-accent-200 to-primary-200 opacity-60 blur-xl -z-10"
            />
            <div className="relative overflow-hidden rounded-[2rem] border-2 border-primary-200 bg-white p-2.5 shadow-card-hover">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/student-certificate-showcase.jpg"
                  alt="Official Verifiable Institute Certificate"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Floating Security Badge */}
            <div className="absolute -bottom-4 right-4 rounded-xl border border-primary-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2 text-xs font-bold text-primary-950">
                <QrCode className="h-4 w-4 text-primary-700" aria-hidden="true" />
                <span>Instant Online QR Verification</span>
              </div>
            </div>
          </div>

          {/* Right Column: Credential Details */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-300 bg-accent-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary-900">
              <Award className="h-3.5 w-3.5 text-primary-700" aria-hidden="true" />
              Accredited Credential
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">
              Earn an Industry-Recognized Diploma Certificate
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Every successful graduate from Creative X Tycoon Institute receives an official certificate
              backed by practical project evaluations, verifiable online via our portal anytime by recruiters and employers.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <span><strong>Unique Serial Number & QR Code:</strong> Employers can instantly verify candidate validity online.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <span><strong>Project & Skills Endorsement:</strong> Highlights the practical software tools and frameworks mastered.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden="true" />
                <span><strong>Lifetime Authenticity:</strong> Permanent record stored securely in the student verification directory.</span>
              </li>
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/verify-certificate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-950"
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Verify a Certificate Online
              </Link>
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-5 py-3 text-sm font-semibold text-primary-900 hover:bg-primary-50"
              >
                Explore Certified Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
