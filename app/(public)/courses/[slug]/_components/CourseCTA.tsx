import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { RequestForm } from "@/components/public/request-form";
import type { CatalogCourse } from "@/lib/config/catalog";

interface CourseCTAProps {
  course: CatalogCourse;
}

export function CourseCTA({ course }: CourseCTAProps) {
  return (
    <section id="enrollment-request" aria-labelledby="cta-heading" className="course-request-section">
      <div className="course-request-copy">
        <span className="public-kicker">Take the next step</span>
        <h2 id="cta-heading">Request admission for {course.name}</h2>
        <p>Share your contact details and our team will explain the current batch, fee and admission steps. Your request goes directly to the institute admin portal.</p>
        <Link href="/contact" className="mt-7 inline-flex items-center gap-2 font-bold text-primary-950">Have a general question? Contact us <ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
      <RequestForm type="enrollment" selectedCourse={{ name: course.name, slug: course.slug }} />
    </section>
  );
}
