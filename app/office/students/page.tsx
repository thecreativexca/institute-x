import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getStudents, getStudentMetrics } from "@/lib/office/students/queries";
import { studentFiltersSchema } from "@/lib/office/students/validation";
import { Course } from "@/models/Course";
import { OfficeShell } from "@/components/office/OfficeShell";
import { StudentTable } from "@/components/office/students/StudentTable";
import { StudentCard } from "@/components/office/students/StudentCard";
import { StudentFilters } from "@/components/office/students/StudentFilters";
import { Pagination } from "@/components/office/students/Pagination";
import { StudentMetrics } from "@/components/office/students/StudentMetrics";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Search, Filter } from "lucide-react";

export const metadata: Metadata = {
  title: "Students — Office Portal",
  description: "Manage student accounts, enrollments, and progress.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface StudentListPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    verified?: string;
    enrolled?: string;
    course?: string;
    from?: string;
    to?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function StudentListPage({ searchParams }: StudentListPageProps) {
  const { user } = await getValidatedSession();
  const params = await searchParams;

  if (!user) {
    redirect("/login?callbackUrl=/office/students");
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the student management portal.
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

  const canRead = hasPermission(user.role, PERMISSIONS.STUDENTS_READ);
  const canUpdate = hasPermission(user.role, PERMISSIONS.STUDENTS_UPDATE);
  const canManageStatus = hasPermission(user.role, PERMISSIONS.STUDENTS_STATUS);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view students.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const parsedParams = studentFiltersSchema.safeParse(params);
  const vp = parsedParams.success ? parsedParams.data : studentFiltersSchema.parse({});

    const filters = {
    search: vp.search,
    status: vp.status as "active" | "inactive" | "suspended" | "ALL" | undefined,
    emailVerified: vp.emailVerified as "verified" | "unverified" | "ALL" | undefined,
    hasEnrollment: vp.hasEnrollment === "true" ? true : vp.hasEnrollment === "false" ? false : undefined,
    courseId: vp.courseId,
    joinedFrom: vp.joinedFrom,
    joinedTo: vp.joinedTo,
  };

  const sort = {
    field: vp.sort || "createdAt",
    direction: vp.direction || "desc",
  } as {
    field: "createdAt" | "name" | "lastLoginAt" | "enrollmentCount";
    direction: "asc" | "desc";
  };

  const pagination = {
    page: vp.page,
    limit: vp.limit,
  };

  const [result, metrics, courses] = await Promise.all([
    getStudents(filters, sort, pagination),
    getStudentMetrics(),
    Course.find({ status: "published", isDisplayed: true }).select("name").lean(),
  ]);

  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="office-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">People management</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Students</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage student accounts, view enrollments, and track progress.
              </p>
            </div>
          </div>

          <StudentMetrics {...metrics} />

          <Card className="mt-6 overflow-hidden border-slate-200/80 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" aria-hidden="true" />
                Student List
              </CardTitle>
              <CardDescription>
                {result.total} student{result.total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StudentFilters
                initialFilters={filters}
                initialSort={sort}
                courses={courseOptions}
              />
            </CardContent>
          </Card>
        </header>

        {result.students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No students match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/office/students">
                      <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                      Clear all filters
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No students found</h3>
                  <p className="mt-2 text-sm text-slate-500">No student accounts have been created yet.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="hidden overflow-hidden border-slate-200/80 shadow-card lg:block">
              <CardContent className="p-0">
                <StudentTable
                  students={result.students}
                  canUpdate={canUpdate}
                  canManageStatus={canManageStatus}
                />
              </CardContent>
            </Card>

            <div className="space-y-3 lg:hidden">
              {result.students.map((student) => (
                <StudentCard key={student.id} student={student} />
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
