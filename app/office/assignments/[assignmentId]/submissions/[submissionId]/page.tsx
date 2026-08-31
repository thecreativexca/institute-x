import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeSubmissionDetail } from "@/lib/office/assignments/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SubmissionDetail } from "@/components/office/assignments/SubmissionDetail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Submission Details — Office Portal",
  description: "Review and grade student submission.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SubmissionDetailPageProps {
  params: Promise<{ assignmentId: string; submissionId: string }>;
}

export default async function SubmissionDetailPage({ params }: SubmissionDetailPageProps) {
  const { user } = await getValidatedSession();
  const { assignmentId, submissionId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/office/assignments/${assignmentId}/submissions/${submissionId}`);
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
              You do not have permission to view this submission.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const submission = await getOfficeSubmissionDetail(assignmentId, submissionId, user.id, user.role);

  if (!submission) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Submission not found</CardTitle>
            <CardDescription>
              The submission you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href={`/office/assignments/${assignmentId}/submissions`}>Back to Submissions</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const canGrade = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_GRADE);

  return (
    <OfficeShell session={user}>
      <div className="max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/office/assignments/${assignmentId}/submissions`}>
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">Submission Review</h1>
            </div>
          </div>
        </header>

        <SubmissionDetail
          submission={submission}
          canGrade={canGrade}
        />
      </div>
    </OfficeShell>
  );
}
