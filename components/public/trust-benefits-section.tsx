import { Container } from "@/components/ui/container";

const trustBenefits = [
  {
    title: "Practical Skill Training",
    description: "Hands-on exercises and real-world projects in every course.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    ),
  },
  {
    title: "Structured Learning Paths",
    description: "Clear curriculum from fundamentals to advanced topics.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    title: "Flexible Online Learning",
    description: "Learn at your own pace with 24/7 access to materials.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
  {
    title: "Expert Guidance",
    description: "Experienced faculty and dedicated support desk.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
      />
    ),
  },
];

/**
 * Compact trust/benefits section immediately after hero.
 * Four key value propositions with icons.
 */
export function TrustBenefitsSection() {
  return (
    <section aria-labelledby="trust-benefits-heading" className="border-b border-primary-100 bg-white">
      <Container className="py-12 sm:py-16">
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" role="list">
          {trustBenefits.map((benefit) => (
            <li
              key={benefit.title}
              className="flex items-start gap-4 rounded-2xl border border-transparent p-3 text-left transition-colors hover:border-primary-100 hover:bg-primary-50/60"
            >
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 shadow-sm">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                >
                  {benefit.icon}
                </svg>
              </span>
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {benefit.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {benefit.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
