import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const benefits = [
  "Learn from fundamentals — no prior experience needed for beginner courses",
  "Follow a clear lesson order with regular checkpoints for revision",
  "Build a portfolio of practical work as you complete each module",
  "Study at a pace that fits your schedule with structured guidance",
  "Get your questions resolved through the institute support desk",
  "Earn recognition of your learning on course completion",
];

/** Learning benefits section — factual descriptions of how training works. */
export function BenefitsSection() {
  return (
    <section aria-labelledby="benefits-heading" className="bg-[#ffffff]">
      <Container className="py-16 sm:py-20">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Learning benefits"
            title="What you get as a student"
            description="Every program is built around the same principle: consistent, measurable progress."
          />
          <ul className="flex flex-col gap-3 rounded-2xl border border-primary-100 bg-white p-5 shadow-card sm:p-6">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                  >
                    <path d="m5 13 4 4L19 7" />
                  </svg>
                </span>
                <p className="text-sm leading-relaxed text-slate-700 sm:text-base">{benefit}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
