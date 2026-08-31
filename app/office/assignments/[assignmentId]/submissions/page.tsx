import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignmentById, getOfficeSubmissions } from "@/lib/office/assignments/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SubmissionsTable } from "@/components/office/assignments/SubmissionsTable";
import { SubmissionCard } from "@/components/office/assignments/SubmissionCard";
import { SubmissionFilters } from "@/components/office/assignments/SubmissionFilters";
import { Pagination } from "@/components/office/assignments/Pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { submissionFiltersSchema } from "@/lib/office/assignments/validation";
import type { z } from "zod";

export const metadata: Metadata = {
  title: "Submissions — Office Portal",
  description: "Review and grade student submissions.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SubmissionsPageProps {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function SubmissionsPage({ params, searchParams }: SubmissionsPageProps) {
  const { user } = await getValidatedSession();
  const { assignmentId } = await params;
  const sp = await searchParams;

  if (!user) {
    redirect(`/login?callbackUrl=/office/assignments/${assignmentId}/submissions`);
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
              You do not have permission to view submissions.
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

  const parsedParams = submissionFiltersSchema.safeParse(sp);
  const vp = parsedParams.success ? parsedParams.data : submissionFiltersSchema.parse({});

  const filters = {
    search: vp.search,
    status: vp.status,
  };

  const sort = {
    field: vp.sort,
    direction: vp.direction,
  };

  const pagination = {
    page: vp.page,
    limit: vp.limit,
  };

  const result = await getOfficeSubmissions(assignmentId, filters, sort, pagination, user.id, user.role);
  const canGrade = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_GRADE);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/office/assignments/${assignmentId}`}>
                  <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                  Back
                </Link>
              </Button>
              <div>
                <p className="text-sm font-medium text-primary-600">Office Portal</p>
                <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>
                <p className="mt-1 text-sm text-slate-500">Submissions</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" aria-hidden="true" />
                Submissions
              </CardTitle>
              <CardDescription>
                {result.total} submission{result.total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionFilters
                initialFilters={filters}
                initialSort={sort}
              />
            </CardContent>
          </Card>
        </header>

        {result.submissions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <FileText className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No submissions match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href={`/office/assignments/${assignmentId}/submissions`}>
                      Clear all filters
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No submissions yet</h3>
                  <p className="mt-2 text-sm text-slate-500">Students haven&apos;t submitted this assignment yet.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="hidden lg:block">
              <CardContent className="p-0">
                <SubmissionsTable
                  submissions={result.submissions}
                  canGrade={canGrade}
                  assignmentMaxScore={assignment.maxScore}
                />
              </CardContent>
            </Card>

            <div className="lg:hidden space-y-3">
              {result.submissions.map((submission) => (
                <SubmissionCard key={submission.id} submission={submission} canGrade={canGrade} assignmentMaxScore={assignment.maxScore} />
              ))}
            </div>

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              totalItems={result.total}
              itemsPerPage={result.limit}
            />
          </>
        )}
      </div>
    </OfficeShell>
  );
}
