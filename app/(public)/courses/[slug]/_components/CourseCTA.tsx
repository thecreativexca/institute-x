import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import type { CatalogCourse } from "@/lib/config/catalog";

interface CourseCTAProps {
  course: CatalogCourse;
}

export function CourseCTA({ course }: CourseCTAProps) {
  const isFree = course.isFree || (course.price ?? 0) === 0;
  const isPurchasable = course.isPurchasable !== false;
  const courseId = course._id ?? course.slug;

  return (
    <section aria-labelledby="cta-heading" className="relative mt-16 overflow-hidden rounded-[2rem] bg-primary-950 px-6 py-12 text-center shadow-card-hover sm:px-10 sm:py-16">
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-300/15 blur-3xl" />
      <div className="relative">
      <SectionHeading
        title="Ready to Start Learning?"
        description="Explore the course and take the next step toward building your skills."
        align="center"
        level={2}
        className="text-white"
      />
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        {!isPurchasable ? (
          <Link href="/contact" className={buttonVariants("secondary", "lg")}>
            Enquire Now
          </Link>
        ) : isFree ? (
          <Link
            href={`/checkout/${courseId}`}
            className={buttonVariants("secondary", "lg")}
          >
            Enroll for Free
          </Link>
        ) : (
          <Link
            href={`/checkout/${courseId}`}
            className={buttonVariants("secondary", "lg")}
          >
            Enroll Now
          </Link>
        )}
        <Link href="/contact" className={buttonVariants("outline", "lg", "border-white text-white hover:bg-white/10")}>
          Contact for Details
        </Link>
      </div>
      <p className="mt-6 text-sm text-primary-100">
        {!isPurchasable ? (
          <>Contact the institute office for the current schedule, availability, and enrollment details.</>
        ) : isFree ? (
          <>This course is <strong className="text-white">free</strong> with lifetime access.</>
        ) : (
          <>
            This course is <strong className="text-white">₹{course.price.toLocaleString("en-IN")}</strong> with lifetime access. No recurring payments. 30-day money-back guarantee.
          </>
        )}
      </p>
      </div>
    </section>
  );
}
