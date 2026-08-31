import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAssignments } from "@/lib/office/assignments/queries";
import { Course } from "@/models/Course";
import { OfficeShell } from "@/components/office/OfficeShell";
import { AssignmentTable } from "@/components/office/assignments/AssignmentTable";
import { AssignmentCard } from "@/components/office/assignments/AssignmentCard";
import { AssignmentFilters } from "@/components/office/assignments/AssignmentFilters";
import { Pagination } from "@/components/office/assignments/Pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter } from "lucide-react";
import { assignmentFiltersSchema } from "@/lib/office/assignments/validation";

export const metadata: Metadata = {
  title: "Assignments — Office Portal",
  description: "Manage course assignments and student submissions.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AssignmentListPageProps {
  searchParams: Promise<{
    q?: string;
    course?: string;
    module?: string;
    status?: string;
    deadline?: string;
    pending?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AssignmentListPage({ searchParams }: AssignmentListPageProps) {
  const { user } = await getValidatedSession();
  const params = await searchParams;

  if (!user) {
    redirect("/login?callbackUrl=/office/assignments");
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

  const canRead = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ);
  const canManage = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_MANAGE);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view assignments.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const parsedParams = assignmentFiltersSchema.safeParse(params);
  const vp = parsedParams.success ? parsedParams.data : assignmentFiltersSchema.parse({});

  const filters = {
    search: vp.search,
    courseId: vp.courseId,
    moduleId: vp.moduleId,
    status: vp.status,
    deadlineFilter: vp.deadlineFilter,
    hasPendingSubmissions: vp.hasPendingSubmissions,
  };

  const sort = {
    field: vp.sort,
    direction: vp.direction,
  };

  const pagination = {
    page: vp.page,
    limit: vp.limit,
  };

  const [result, courses] = await Promise.all([
    getOfficeAssignments(filters, sort, pagination, user.id, user.role),
    Course.find({ status: "published" }).select("name").lean(),
  ]);

  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="office-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Academic workflow</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Assignments</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage course assignments, review submissions, and grade student work.
              </p>
            </div>
            {canManage && (
              <Button asChild className="rounded-xl shadow-sm">
                <Link href="/office/assignments/new">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Create Assignment
                </Link>
              </Button>
            )}
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden="true" />
                Assignment List
              </CardTitle>
              <CardDescription>
                {result.total} assignment{result.total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentFilters
                initialFilters={filters}
                initialSort={sort}
                courses={courseOptions}
              />
            </CardContent>
          </Card>
        </header>

        {result.assignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No assignments match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/office/assignments">
                      <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                      Clear all filters
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No assignments found</h3>
                  <p className="mt-2 text-sm text-slate-500">Create your first assignment to get started.</p>
                  {canManage && (
                    <Button className="mt-4" asChild>
                      <Link href="/office/assignments/new">
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                        Create Assignment
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="hidden overflow-hidden border-slate-200/80 shadow-card lg:block">
              <CardContent className="p-0">
                <AssignmentTable
                  assignments={result.assignments}
                  canManage={canManage}
                  canGrade={hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_GRADE)}
                />
              </CardContent>
            </Card>

            <div className="space-y-3 lg:hidden">
              {result.assignments.map((assignment) => (
                <AssignmentCard key={assignment.id} assignment={assignment} canManage={canManage} />
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
