import Link from "next/link";
import { ArrowRight, Code2, Laptop, Palette, MessageSquare, HeartPulse } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { COURSE_CATEGORIES, getCoursesByCategorySlug } from "@/lib/config/catalog";

const categoryIcons: Record<string, typeof Laptop> = {
  "basic-office-skills": Laptop,
  "web-programming": Code2,
  "creative-digital": Palette,
  "communication-development": MessageSquare,
  "healthcare-wellness": HeartPulse,
};

/** Course category overview with rich interactive cards */
export function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="border-y border-primary-100 bg-gradient-to-b from-primary-50/50 to-white py-16 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="Specialized Career Wings"
          title="Explore Our Core Disciplines"
          description="Structured vocational and professional programs engineered to meet industry employment standards."
        />
        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COURSE_CATEGORIES.map((category) => {
            const courses = getCoursesByCategorySlug(category.slug);
            const Icon = categoryIcons[category.slug] || Laptop;

            return (
              <li key={category.slug} className="h-full">
                <Link href={`/courses?category=${category.slug}`} className="group block h-full">
                  <Card className="h-full border border-primary-200/80 bg-white transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary-400 group-hover:shadow-[0_12px_28px_-8px_rgba(161,98,7,0.16)]">
                    <CardContent className="flex h-full flex-col p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-800 transition-colors group-hover:bg-primary-900 group-hover:text-white">
                          <Icon className="h-6 w-6" aria-hidden="true" />
                        </div>
                        <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-bold text-primary-900">
                          {courses.length} Courses
                        </span>
                      </div>

                      <h3 className="mt-5 text-lg font-bold text-primary-950 group-hover:text-primary-700 transition-colors">
                        {category.name}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        {category.description}
                      </p>

                      <div className="mt-auto pt-5">
                        <div className="border-t border-primary-100/70 pt-3 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Explore curriculum</span>
                          <span className="font-semibold text-primary-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            View Courses <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}

          {/* Catalog CTA tile */}
          <li className="h-full">
            <Link
              href="/courses"
              aria-label="View all courses"
              className="group flex h-full min-h-48 flex-col items-start justify-between rounded-2xl border-2 border-dashed border-accent-300 bg-gradient-to-br from-accent-100/80 to-accent-50 p-6 transition-all duration-300 hover:border-accent-400 hover:shadow-card-hover"
            >
              <div>
                <span className="rounded-full bg-accent-300 px-3 py-1 text-xs font-bold text-primary-950">
                  Full Institute Catalog
                </span>
                <h3 className="mt-4 text-xl font-extrabold text-primary-950">
                  Looking for Custom Learning Tracks?
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">
                  Search all 16+ courses, download brochures, or compare modules across disciplines.
                </p>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-900 group-hover:translate-x-1 transition-transform">
                Browse All Courses <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </div>
            </Link>
          </li>
        </ul>
      </Container>
    </section>
  );
}
