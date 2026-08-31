import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  {
    number: "01",
    title: "Choose Your Course",
    description:
      "Browse our catalog of 16 career-focused courses across 5 categories. Filter by skill level, duration, and interest to find the right fit.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
      />
    ),
  },
  {
    number: "02",
    title: "Learn Through Video Lessons",
    description:
      "Watch structured video lessons organized into modules. Each lesson includes downloadable notes, code samples, and supplementary resources.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    ),
  },
  {
    number: "03",
    title: "Practice With Notes & Assessments",
    description:
      "Reinforce learning with hands-on assignments, quizzes, and practical exercises. Submit work for feedback and track your scores.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    number: "04",
    title: "Track Your Progress",
    description:
      "Monitor completion rates, quiz scores, and assignment grades in your personal dashboard. Earn certificates upon course completion.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
];

/**
 * How Learning Works — 4-step visual process.
 * Communicates the future LMS experience clearly.
 */
export function HowLearningWorksSection() {
  return (
    <section aria-labelledby="how-it-works-heading" className="bg-accent-50/70">
      <Container className="py-16 sm:py-24">
        <SectionHeading
          eyebrow="How it works"
          title="Your learning journey in four steps"
          description="A structured path from enrollment to certification — designed for measurable progress."
        />
        <div className="mx-auto mt-12 max-w-5xl">
          <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line */}
            <div
              className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-0.5 bg-primary-200 lg:block"
              aria-hidden="true"
            />
            {steps.map((step) => (
              <li
                key={step.number}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary-200 bg-white shadow-card">
                  <span className="text-2xl font-bold text-primary-700">
                    {step.number}
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
                <div className="mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-800">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-7 w-7"
                  >
                    {step.icon}
                  </svg>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
