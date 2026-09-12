import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  {
    title: "Structured curriculum",
    body: "Courses are broken into modules and lessons with a defined order, so you always know what comes next.",
    icon: (
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
    ),
  },
  {
    title: "Hands-on practice",
    body: "Practical exercises and assignments help you apply concepts instead of just watching them.",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Progress tracking",
    body: "Your completed lessons, assignments and quiz results stay organised in your student portal.",
    icon: (
      <>
        <path d="M3 3v18h18" strokeLinecap="round" />
        <path d="m7 14 4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "Guidance when needed",
    body: "Raise a support ticket from your portal and the office team will help you resolve issues.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.8.4-1.2.9-1.2 1.8" strokeLinecap="round" />
        <path d="M12 17h.01" strokeLinecap="round" />
      </>
    ),
  },
];

/** "Why choose us" — describes the training approach without unverifiable claims. */
export function WhyChooseUsSection() {
  return (
    <section aria-labelledby="why-us-heading" className="border-y border-primary-100 bg-gradient-to-b from-primary-50/70 to-[#ffffff]">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Why choose us"
          title="Learning designed to keep you on track"
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <li key={feature.title}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-primary-100 bg-white/95 p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent-100 text-primary-800">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-6 w-6"
                  >
                    {feature.icon}
                  </svg>
                </span>
                <h3 className="text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{feature.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
