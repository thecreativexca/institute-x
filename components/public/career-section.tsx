import Link from "next/link";

import { Container } from "@/components/ui/container";
import { CATALOG_COURSES, COURSE_CATEGORIES, getCategoryBySlug } from "@/lib/config/catalog";

/**
 * Career-focused section.
 * Carefully worded: describes preparation and skill-building only.
 * No placement percentages, salary claims or job guarantees (client data pending).
 */
export function CareerSection() {
  const paths = COURSE_CATEGORIES.map((category) => ({
    name: category.name,
    courses: CATALOG_COURSES.filter((c) => c.categorySlug === category.slug),
    category,
  }));

  return (
    <section aria-labelledby="career-heading" className="bg-primary-950">
      <Container className="py-16 text-white sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-300">
            Career development
          </p>
          <h2 id="career-heading" className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Skills that open doors
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-primary-100">
            From your first computer certificate to full-stack development — every course is
            designed to move you toward practical, employable skills at your own pace.
          </p>
        </div>

        <div className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
          {paths.flatMap(({ name, category, courses }) =>
            courses.slice(0, 2).map((course) => (
              <span key={course.slug}>
                <Link
                  href="/courses"
                  aria-label={`${course.name} — in ${name}`}
                  className="inline-flex items-center rounded-full border border-primary-700 bg-primary-900 px-4 py-1.5 text-sm text-primary-100 transition-colors hover:border-accent-300 hover:text-white"
                >
                  {course.name}
                  <span className="sr-only"> ({getCategoryBySlug(category.slug)?.name})</span>
                </Link>
              </span>
            ))
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-xl bg-accent-300 px-6 text-base font-semibold text-primary-950 transition-colors hover:bg-accent-400">
            Start learning today
          </Link>
        </div>
      </Container>
    </section>
  );
}
