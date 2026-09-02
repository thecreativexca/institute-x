import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCategoryOptions } from "@/lib/office/courses/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CourseForm } from "@/components/office/courses/course-form";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "New Course — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const { user } = await getValidatedSession();
  if (!user) redirect("/office/login?callbackUrl=/office/courses/new");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canManage = hasPermission(user.role, PERMISSIONS.COURSES_CREATE);
  const categories = await getCategoryOptions();

  if (!canManage) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg p-8 text-center text-sm text-slate-600">
          You do not have permission to create courses.
        </Card>
      </OfficeShell>
    );
  }

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/office/courses" className={buttonVariants("ghost", "sm", "-ml-2 text-slate-500")}>
              ← Back to courses
            </Link>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">New Course</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Fill in the basics now — you can build the curriculum (YouTube / text / PDF lessons) right after creating it.
            </p>
          </div>
        </header>
        <CourseForm mode="create" categories={categories} canSubmit />
      </div>
    </OfficeShell>
  );
}
