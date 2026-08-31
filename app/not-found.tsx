import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <main id="main-content" className="flex flex-1 items-center justify-center bg-slate-50">
      <Container className="py-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-slate-600">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/" className={buttonVariants("primary", "md")}>
            Go to Home
          </Link>
          <Link href="/courses" className={buttonVariants("outline", "md")}>
            Browse Courses
          </Link>
        </div>
      </Container>
    </main>
  );
}
