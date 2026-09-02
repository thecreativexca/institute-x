import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getCourseDetail } from "@/lib/office/courses/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CourseStatusBadge } from "@/components/office/courses/course-status-badge";
import { CourseStatusActions } from "@/components/office/courses/course-status-actions";
import { ThumbnailUploader } from "@/components/office/courses/thumbnail-uploader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Layers,
  PlaySquare,
  Users,
  IndianRupee,
  FileStack,
  Pencil,
  ListTree,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Course — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface CourseDetailPageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
  const { user } = await getValidatedSession();
  if (!user) redirect(`/office/login?callbackUrl=/office/courses/${courseId}`);
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canRead = hasPermission(user.role, PERMISSIONS.COURSES_READ);
  const canUpdate = hasPermission(user.role, PERMISSIONS.COURSES_UPDATE);
  const canPublish = hasPermission(user.role, PERMISSIONS.COURSES_PUBLISH);

  const course = await getCourseDetail(courseId);
  if (!course) notFound();

  const modeLabel = course.learningMode.charAt(0).toUpperCase() + course.learningMode.slice(1);
  const priceLabel = course.isFree ? "Free" : `${course.currency} ${course.price ?? 0}`;

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <div>
          <Link
            href="/office/courses"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            ← Back to courses
          </Link>
          <div className="office-page-header mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CourseStatusBadge status={course.status} />
                {course.isDisplayed ? <Badge variant="success">Visible on site</Badge> : <Badge variant="neutral">Hidden</Badge>}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{course.name}</h1>
              <p className="mt-1 text-sm text-slate-500">
                {course.categoryName} · {course.level.replace("_", " ")} · {modeLabel}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {canUpdate ? (
                <Link href={`/office/courses/${course.id}/edit`} className={buttonVariants("outline", "md", "rounded-xl")}>
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Edit course
                </Link>
              ) : null}
              <CourseStatusActions
                courseId={course.id}
                courseName={course.name}
                status={course.status}
                canPublish={canPublish}
                canUpdate={canUpdate}
                enrollmentCount={course.counts.enrollments}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Course overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <StatTile icon={Layers} value={course.counts.modules} label="Modules" />
                <StatTile icon={PlaySquare} value={course.counts.lessons} label="Lessons" />
                <StatTile icon={Users} value={course.counts.enrollments} label="Enrolled" />
              </div>

              <div className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <Info label="Price">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                    <IndianRupee className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {priceLabel}
                  </span>
                  {!course.isFree && course.compareAtPrice ? (
                    <span className="ml-2 text-xs text-slate-400 line-through">
                      {course.currency} {course.compareAtPrice}
                    </span>
                  ) : null}
                </Info>
                <Info label="Purchasable">{course.isPurchasable ? "Yes" : "No"}</Info>
                <Info label="Duration">
                  {course.durationWeeks ? `${course.durationWeeks} week${course.durationWeeks !== 1 ? "s" : ""}` : "Not set"}
                </Info>
                <Info label="Instructor">{course.instructorName || "Not set"}</Info>
              </div>

              {course.shortDescription || course.description ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">
                    {course.description || course.shortDescription}
                  </p>
                </div>
              ) : null}

              {course.tags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="text-base">Thumbnail</CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <ThumbnailUploader courseId={course.id} initialUrl={course.thumbnailUrl} canEdit={canUpdate} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileStack className="h-4 w-4 text-slate-400" aria-hidden="true" /> Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-5 text-sm">
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Published lessons</span>
                  <span className="font-semibold text-slate-800">{course.counts.publishedLessons}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Draft lessons</span>
                  <span className="font-semibold text-slate-800">{course.counts.draftLessons}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="text-slate-500">Attached resources</span>
                  <span className="font-semibold text-slate-800">{course.counts.resources}</span>
                </p>
                <Link
                  href={`/office/courses/${course.id}/curriculum`}
                  className={buttonVariants("secondary", "md", "mt-2 w-full rounded-xl")}
                >
                  <ListTree className="h-4 w-4" aria-hidden="true" /> Manage curriculum
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {!canRead ? null : (
          <p className="text-xs text-slate-400">
            Created {new Date(course.createdAt).toLocaleDateString("en-IN")} · Last updated{" "}
            {new Date(course.updatedAt).toLocaleDateString("en-IN")}
          </p>
        )}
      </div>
    </OfficeShell>
  );
}

function StatTile({ icon: Icon, value, label }: { icon: typeof Layers; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
      <p className="flex items-center justify-center gap-1.5 text-lg font-bold text-slate-800">
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
