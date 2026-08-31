import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Types } from "mongoose";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getStudentById } from "@/lib/office/students/queries";
import { getAvailableCoursesForEnrollment } from "@/lib/office/students/mutations";
import { OfficeShell } from "@/components/office/OfficeShell";
import { EnrollForm } from "@/components/office/students/EnrollForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Enroll Student — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EnrollStudentPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function EnrollStudentPage({ params }: EnrollStudentPageProps) {
  const { studentId } = await params;

  if (!Types.ObjectId.isValid(studentId)) {
    notFound();
  }

  const { user } = await getValidatedSession();

  if (!user || !canAccessOffice(user.role) || !hasPermission(user.role, PERMISSIONS.ENROLLMENTS_MANAGE)) {
    notFound();
  }

  const student = await getStudentById(studentId);
  if (!student) {
    notFound();
  }

  const courses = await getAvailableCoursesForEnrollment(studentId);

  return (
    <OfficeShell session={user}>
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <p className="text-sm font-medium text-primary-600">Office Portal / Students</p>
          <h1 className="text-2xl font-bold text-slate-900">Enroll in Course</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manually enroll <span className="font-medium">{student.name}</span> in a course.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Manual Enrollment</CardTitle>
            <CardDescription>
              Use for offline admissions, scholarships, or complimentary enrollment. The action is
              recorded in the office audit log.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.status === "suspended" ? (
              <p className="text-sm text-red-600">
                This student&apos;s account is suspended. Reactivate the account before enrolling.
              </p>
            ) : courses.length === 0 ? (
              <p className="text-sm text-slate-500">
                No published courses are available for this student — they are already enrolled in
                all of them.
              </p>
            ) : (
              <EnrollForm studentId={studentId} courses={courses} />
            )}
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
