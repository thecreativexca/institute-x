import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCourseDetail, getCategoryOptions } from "@/lib/office/courses/queries";
import type { CategoryOption, CourseFormValues, OfficeCourseDetail } from "@/lib/office/courses/dto";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CourseForm } from "@/components/office/courses/course-form";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Edit Course — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EditCoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { courseId } = await params;
  const { user } = await getValidatedSession();
  if (!user) redirect(`/office/login?callbackUrl=/office/courses/${courseId}/edit`);
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canUpdate = hasPermission(user.role, PERMISSIONS.COURSES_UPDATE);
  const [course, categoryOptions] = await Promise.all([
    getCourseDetail(courseId),
    getCategoryOptions(),
  ]);
  if (!course) notFound();

  if (!canUpdate) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg p-8 text-center text-sm text-slate-600">
          You do not have permission to edit courses.
        </Card>
      </OfficeShell>
    );
  }

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/office/courses/${course.id}`}
              className={buttonVariants("ghost", "sm", "-ml-2 text-slate-500")}
            >
              ← Back to {course.name}
            </Link>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Edit course</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Update the course details below. Curriculum lives in the course overview.
            </p>
          </div>
        </header>
        <CourseForm
          mode="edit"
          courseId={course.id}
          categories={mergeCategory(categoryOptions, course)}
          initial={detailToFormValues(course)}
          canSubmit={canUpdate}
        />
      </div>
    </OfficeShell>
  );
}

/** Categories for the dropdown, guaranteed to include the course's current one. */
function mergeCategory(
  options: CategoryOption[],
  course: OfficeCourseDetail
): CategoryOption[] {
  if (options.some((option) => option.id === course.categoryId)) return options;
  return [{ id: course.categoryId, name: course.categoryName || "Uncategorized" }, ...options];
}

function detailToFormValues(detail: OfficeCourseDetail): CourseFormValues {
  return {
    name: detail.name,
    slug: detail.slug,
    categoryId: detail.categoryId,
    shortDescription: detail.shortDescription,
    description: detail.description,
    level: detail.level,
    learningMode: detail.learningMode,
    durationWeeks: detail.durationWeeks != null ? String(detail.durationWeeks) : "",
    isFree: detail.isFree,
    isPurchasable: detail.isPurchasable,
    price: detail.price != null ? String(detail.price) : "",
    compareAtPrice: detail.compareAtPrice != null ? String(detail.compareAtPrice) : "",
    instructorName: detail.instructorName,
    tags: detail.tags.join(", "),
    learningOutcomes: detail.learningOutcomes.join("\n"),
    requirements: detail.requirements.join("\n"),
    targetAudience: detail.targetAudience.join("\n"),
    faqs: detail.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
      enabled: faq.enabled,
    })),
    seoTitle: detail.seoTitle,
    seoDescription: detail.seoDescription,
  };
}
