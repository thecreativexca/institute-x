import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizzes } from "@/lib/office/quizzes/queries";
import { Course } from "@/models/Course";
import { OfficeShell } from "@/components/office/OfficeShell";
import { QuizTable } from "@/components/office/quizzes/QuizTable";
import { QuizCard } from "@/components/office/quizzes/QuizCard";
import { QuizFilters } from "@/components/office/quizzes/QuizFilters";
import { Pagination } from "@/components/office/quizzes/Pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus } from "lucide-react";
import { quizFiltersSchema } from "@/lib/office/quizzes/validation";

export const metadata: Metadata = {
  title: "Quizzes — Office Portal",
  description: "Manage quizzes and tests for your courses.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface QuizListPageProps {
  searchParams: Promise<{
    q?: string;
    course?: string;
    module?: string;
    type?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function QuizListPage({ searchParams }: QuizListPageProps) {
  const { user } = await getValidatedSession();
  const params = await searchParams;

  if (!user) {
    redirect("/login?callbackUrl=/office/quizzes");
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the quiz management portal.
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

  const canRead = hasPermission(user.role, PERMISSIONS.QUIZZES_READ);
  const canManage = hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view quizzes.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const parsedParams = quizFiltersSchema.safeParse(params);
  const vp = parsedParams.success ? parsedParams.data : quizFiltersSchema.parse({});

  const filters = {
    search: vp.search,
    courseId: vp.courseId,
    moduleId: vp.moduleId,
    type: vp.type,
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

  const [result, courses] = await Promise.all([
    getOfficeQuizzes(filters, sort, pagination, user.id, user.role),
    Course.find({ status: "published" }).select("name").lean(),
  ]);

  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="office-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Assessment center</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quizzes &amp; Tests</h1>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage quizzes, module tests, and final exams.
              </p>
            </div>
            {canManage && (
              <Button asChild className="rounded-xl shadow-sm">
                <Link href="/office/quizzes/new">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Create Quiz
                </Link>
              </Button>
            )}
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden="true" />
                Quiz List
              </CardTitle>
              <CardDescription>
                {result.total} quiz{result.total !== 1 ? "es" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuizFilters
                initialFilters={filters}
                initialSort={sort}
                courses={courseOptions}
              />
            </CardContent>
          </Card>
        </header>

        {result.quizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No quizzes match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/office/quizzes">
                      <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                      Clear all filters
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No quizzes found</h3>
                  <p className="mt-2 text-sm text-slate-500">Create your first quiz to get started.</p>
                  {canManage && (
                    <Button className="mt-4" asChild>
                      <Link href="/office/quizzes/new">
                        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                        Create Quiz
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
                <QuizTable
                  quizzes={result.quizzes}
                  canManage={canManage}
                  canViewResults={hasPermission(user.role, PERMISSIONS.QUIZ_RESULTS_READ)}
                />
              </CardContent>
            </Card>

            <div className="space-y-3 lg:hidden">
              {result.quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} canManage={canManage} />
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
