import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";

/** Final call-to-action before the footer. */
export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="bg-primary-50/65">
      <Container className="py-16 sm:py-20">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-[1.75rem] border border-primary-200 bg-white p-8 text-center shadow-card-hover sm:p-12">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-primary-300 via-accent-300 to-primary-300" />
          <h2 id="cta-heading" className="text-balance text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Ready to begin?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Browse the catalog or reach out to our office — we will help you choose the right course.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/courses" className={buttonVariants("primary", "lg", "w-full sm:w-auto")}>
              Explore Courses
            </Link>
            <a
              href={siteConfig.contact.phoneHref}
              className={buttonVariants("outline", "lg", "w-full sm:w-auto")}
            >
              Call the Office
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
