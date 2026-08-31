import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getStudentById } from "@/lib/office/students/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { Types } from "mongoose";

export const metadata: Metadata = {
  title: "Edit Student — Office Portal",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EditStudentPageProps {
  params: Promise<{ studentId: string }>;
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { studentId } = await params;

  if (!Types.ObjectId.isValid(studentId)) {
    notFound();
  }

  const { user } = await getValidatedSession();

  if (!user) {
    redirect(`/login?callbackUrl=/office/students/${studentId}/edit`);
  }

  if (!canAccessOffice(user.role)) {
    notFound();
  }

  const canRead = hasPermission(user.role, PERMISSIONS.STUDENTS_READ);
  const canUpdate = hasPermission(user.role, PERMISSIONS.STUDENTS_UPDATE);

  if (!canRead || !canUpdate) {
    notFound();
  }

  const student = await getStudentById(studentId);
  if (!student) {
    notFound();
  }

  return (
    <OfficeShell session={user}>
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <Link href={`/office/students/${studentId}`} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary-600">Office Portal / Students</p>
            <h1 className="text-2xl font-bold text-slate-900">Edit Student</h1>
            <p className="mt-1 text-sm text-slate-500">Update profile information for {student.name}</p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" aria-hidden="true" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update the student&apos;s basic profile details. Email changes will require re-verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={`/api/office/students/${studentId}`} method="POST" className="space-y-6">
              <input type="hidden" name="action" value="update" />

              <div className="space-y-2">
                <Input
                  name="name"
                  label="Full Name"
                  defaultValue={student.name}
                  required
                  maxLength={120}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Input
                  name="email"
                  label="Email Address"
                  type="email"
                  defaultValue={student.email}
                  required
                  className="w-full"
                />
                <p className="text-sm text-slate-500">
                  Changing the email will mark it as unverified and send a new verification email.
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  name="phone"
                  label="Phone Number"
                  type="tel"
                  defaultValue={student.phone || ""}
                  placeholder="Optional"
                  maxLength={20}
                  className="w-full"
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-slate-400" aria-hidden="true" />
                  <div className="text-sm text-slate-600">
                    <p className="font-medium">Read-only Information</p>
                    <p>The following cannot be changed through this form:</p>
                    <ul className="mt-1 list-disc list-inside space-y-0.5">
                      <li>Account status (use status management)</li>
                      <li>Role and permissions</li>
                      <li>Password hash</li>
                      <li>Security tokens and session version</li>
                      <li>Email verification status</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Link href={`/office/students/${studentId}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-slate-500" aria-hidden="true" />
              Account Status
            </CardTitle>
            <CardDescription>
              Current status: <span className="font-medium capitalize">{student.status}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Account status changes (activate, suspend, inactivate) are managed from the student profile page
              using the dedicated status actions. This ensures proper audit logging and session invalidation.
            </p>
            <Link href={`/office/students/${studentId}`}>
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
