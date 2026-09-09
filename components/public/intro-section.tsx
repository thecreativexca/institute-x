import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/lib/config/site";

/**
 * Short institute introduction.
 * TODO(client): replace this copy with the real institute's story, mission
 * and history once provided. No unverifiable claims are made here.
 */
export function IntroSection() {
  return (
    <section aria-labelledby="intro-heading" className="bg-[#fffef8]">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          align="center"
          eyebrow={`About ${siteConfig.name}`}
          title="Structured training for real workplace skills"
          description={`${siteConfig.name} programs follow a clear curriculum — from fundamentals to practical application — so learners build confidence step by step with guided practice and regular assessment.`}
        />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {[
            {
              title: "Clear curriculum",
              body: "Every course is organised into modules and lessons so progress is easy to follow.",
            },
            {
              title: "Practice-first learning",
              body: "Concepts are reinforced through exercises, assignments and hands-on tasks.",
            },
            {
              title: "Supportive environment",
              body: "Faculty guidance and an office support desk keep learners moving forward.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50/70 p-6 shadow-card">
              <span aria-hidden="true" className="mx-auto mb-4 block h-1.5 w-10 rounded-full bg-accent-300" />
              <h3 className="text-base font-semibold text-primary-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
