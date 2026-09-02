import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCourseCurriculum } from "@/lib/office/courses/queries";
import { getMaxResourceFileSizeMB } from "@/lib/config/env";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CurriculumManager } from "@/components/office/courses/curriculum-manager";
import { CourseStatusBadge } from "@/components/office/courses/course-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Pencil } from "lucide-react";

export const metadata: Metadata = {
  title: "Course Curriculum — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface CourseCurriculumPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseCurriculumPage({ params }: CourseCurriculumPageProps) {
  const { courseId } = await params;
  const { user } = await getValidatedSession();
  if (!user) redirect(`/office/login?callbackUrl=/office/courses/${courseId}/curriculum`);
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canUpdate = hasPermission(user.role, PERMISSIONS.COURSES_UPDATE);
  const curriculum = await getCourseCurriculum(courseId);
  if (!curriculum) notFound();

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href={`/office/courses/${curriculum.course.id}`}
              className={buttonVariants("ghost", "sm", "-ml-2 text-slate-500")}
            >
              ← Back to {curriculum.course.name}
            </Link>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Curriculum</h1>
              <CourseStatusBadge status={curriculum.course.status} />
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Structure {curriculum.course.name} into modules and lessons. Lessons can be text, a YouTube
              embed, or PDF attachments. {curriculum.counts.lessons} lessons across{" "}
              {curriculum.counts.modules} modules.
            </p>
          </div>
          {canUpdate ? (
            <Link
              href={`/office/courses/${curriculum.course.id}/edit`}
              className={buttonVariants("outline", "md", "rounded-xl")}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit details
            </Link>
          ) : null}
        </header>

        <CurriculumManager
          curriculum={curriculum}
          canManageModules={canUpdate}
          canManageLessons={canUpdate}
          canManageResources={canUpdate}
          maxResourceSizeMB={getMaxResourceFileSizeMB()}
        />
      </div>
    </OfficeShell>
  );
}
