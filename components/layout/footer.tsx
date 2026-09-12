import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { COURSE_CATEGORIES, getCoursesByCategorySlug } from "@/lib/config/catalog";
import { siteConfig } from "@/lib/config/site";

/** Public website footer. All identity values come from siteConfig/catalog. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-primary-200 bg-primary-50 text-primary-950">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-300/10 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-primary-500/15 blur-3xl" />
      <Container className="py-12 lg:py-14">
        <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Logo />
            <p className="max-w-xs text-sm leading-relaxed text-primary-700">
              {siteConfig.description}
            </p>
          </div>

          <nav aria-label="Footer — institute links">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-900">
              Institute
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-primary-700 transition-colors hover:text-primary-950"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Footer — course categories">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-900">
              Course Categories
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5">
              {COURSE_CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/courses?category=${category.slug}`}
                    className="text-sm text-primary-700 transition-colors hover:text-primary-950"
                  >
                    {category.name}{" "}
                    <span className="text-primary-600">
                      ({getCoursesByCategorySlug(category.slug).length})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-primary-900">
              Contact
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-primary-700">
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-primary-950"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.contact.phoneHref}
                  className="transition-colors hover:text-primary-950"
                >
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="leading-relaxed">{siteConfig.contact.address}</li>
            </ul>
          </div>
        </div>

        <div className="relative mt-12 flex flex-col items-center justify-between gap-3 border-t border-primary-200 pt-6 sm:flex-row">
          <p className="text-xs text-primary-700">
            © {year} {siteConfig.name}. All rights reserved.
          </p>
          <nav aria-label="Footer — legal" className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/privacy"
              className="text-xs text-primary-700 transition-colors hover:text-primary-950"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-primary-700 transition-colors hover:text-primary-950"
            >
              Terms & Conditions
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
