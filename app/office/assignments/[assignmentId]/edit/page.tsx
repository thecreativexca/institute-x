import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignmentById } from "@/lib/office/assignments/queries";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { OfficeShell } from "@/components/office/OfficeShell";
import { EditAssignmentForm } from "@/components/office/assignments/EditAssignmentForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Assignment — Office Portal",
  description: "Edit an existing assignment.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EditAssignmentPageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { user } = await getValidatedSession();
  const { assignmentId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/office/assignments/${assignmentId}/edit`);
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the assignment management portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_MANAGE)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to edit assignments.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const assignment = await getOfficeAssignmentById(assignmentId, user.id, user.role);

  if (!assignment) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Assignment not found</CardTitle>
            <CardDescription>
              The assignment you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/office/assignments">Back to Assignments</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const courses = await Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean();
  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  const modules = await Module.find({ course: assignment.courseId }).select("title").sort({ sortOrder: 1 }).lean();
  const moduleOptions = modules.map((m) => ({ id: m._id.toString(), title: m.title }));

  let lessonOptions: { id: string; title: string }[] = [];
  if (assignment.moduleId) {
    const lessons = await Lesson.find({ module: assignment.moduleId, isPublished: true })
      .select("title")
      .sort({ sortOrder: 1 })
      .lean();
    lessonOptions = lessons.map((l) => ({ id: l._id.toString(), title: l.title }));
  }

  return (
    <OfficeShell session={user}>
      <div className="max-w-3xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/office/assignments/${assignmentId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">Edit Assignment</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Update the assignment details below. Changes to published assignments may affect students.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
            <CardDescription>
              Modify the assignment details. Be careful when changing deadline or max marks after submissions exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditAssignmentForm
              assignment={assignment}
              courseOptions={courseOptions}
              initialModules={moduleOptions}
              initialLessons={lessonOptions}
            />
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
