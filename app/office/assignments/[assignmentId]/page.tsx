import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignmentById } from "@/lib/office/assignments/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { AssignmentDetail } from "@/components/office/assignments/AssignmentDetail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Assignment Details — Office Portal",
  description: "View assignment details and manage submissions.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AssignmentDetailPageProps {
  params: Promise<{ assignmentId: string }>;
}

export default async function AssignmentDetailPage({ params }: AssignmentDetailPageProps) {
  const { user } = await getValidatedSession();
  const { assignmentId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/office/assignments/${assignmentId}`);
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

  if (!hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view this assignment.
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

  const canManage = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_MANAGE);
  const canGrade = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_GRADE);

  return (
    <OfficeShell session={user}>
      <div className="max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/office/assignments">
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
            </div>
          </div>
        </header>

        <AssignmentDetail
          assignment={assignment}
          canManage={canManage}
          canGrade={canGrade}
        />
      </div>
    </OfficeShell>
  );
}
