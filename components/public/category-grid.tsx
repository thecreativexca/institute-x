import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { COURSE_CATEGORIES, getCoursesByCategorySlug } from "@/lib/config/catalog";

/** Course category overview. Counts are derived from data, never hardcoded. */
export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="border-y border-primary-100 bg-primary-50/55">
      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Course categories"
          title="Find the right path for your goals"
          description="Training programs across office skills, technology, creative fields, communication and healthcare."
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_CATEGORIES.map((category) => {
            const courses = getCoursesByCategorySlug(category.slug);
            return (
              <li key={category.slug} className="h-full">
                <Card className="h-full border-primary-100 bg-white/90 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover">
                  <CardContent className="flex h-full flex-col gap-3 pt-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {category.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-800">
                        {courses.length} courses
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {category.description}
                    </p>
                    <p className="mt-auto pt-2 text-xs text-slate-500">
                      Includes: {courses.slice(0, 3).map((c) => c.name).join(", ")}
                      {courses.length > 3 ? " and more" : ""}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
          {/* CTA tile keeps the grid balanced on large screens */}
          <li className="h-full">
            <Link
              href="/courses"
              aria-label="View all courses"
                className="flex h-full min-h-40 flex-col items-start justify-center gap-3 rounded-xl border border-dashed border-accent-400 bg-accent-100/65 p-6 transition-colors hover:bg-accent-200/70"
            >
              <span className="text-lg font-semibold text-primary-900">Browse the full catalog</span>
              <span className={buttonVariants("primary", "sm")}>View all courses</span>
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
