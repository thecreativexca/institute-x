import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, HeartPulse, Laptop, MessageSquareText, Palette } from "lucide-react";

import { Container } from "@/components/ui/container";
import { COURSE_CATEGORIES, type CatalogCourse } from "@/lib/config/catalog";

const categoryIcons = {
  "basic-office-skills": Laptop,
  "web-programming": Code2,
  "creative-digital": Palette,
  "communication-development": MessageSquareText,
  "healthcare-wellness": HeartPulse,
} as const;

const categoryColors = ["blue", "teal", "orange", "violet", "green"];

export function CategoryGrid({ courses }: { courses: readonly CatalogCourse[] }) {
  return (
    <section className="education-categories" aria-labelledby="categories-heading">
      <Container>
        <div className="education-section-heading" data-reveal>
          <div><span className="education-eyebrow"><BriefcaseBusiness className="h-4 w-4" /> Career-ready subjects</span><h2 id="categories-heading">Explore course categories</h2></div>
          <p>Start with the subject that matches your goal. Every category leads to real courses already available in the catalog.</p>
        </div>
        <ul className="education-category-list" data-reveal>
          {COURSE_CATEGORIES.map((category, index) => {
            const Icon = categoryIcons[category.slug as keyof typeof categoryIcons] ?? Laptop;
            const count = courses.filter((course) => course.categorySlug === category.slug).length;
            return (
              <li key={category.slug} data-color={categoryColors[index]}>
                <Link href={`/courses?category=${category.slug}`}>
                  <span className="education-category-icon"><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <span><strong>{category.name}</strong><small>{count} {count === 1 ? "course" : "courses"}</small></span>
                  <ArrowRight className="h-5 w-5 education-category-arrow" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
