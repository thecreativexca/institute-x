import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { listCourses, getCategoryOptions } from "@/lib/office/courses/queries";
import type { OfficeCourseSummary } from "@/lib/office/courses/dto";
import { OfficeShell } from "@/components/office/OfficeShell";
import { CourseListToolbar } from "@/components/office/courses/course-list-toolbar";
import { CourseStatusBadge } from "@/components/office/courses/course-status-badge";
import { CourseStatusActions } from "@/components/office/courses/course-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import {
  Layers,
  PlaySquare,
  Plus,
  Users,
  IndianRupee,
  Library,
  ArrowUpRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Courses — Office Portal",
  description: "Create and manage institute courses, curriculum and content.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["draft", "published", "archived"] as const;
const VALID_SORTS = [
  "recently_updated",
  "newest",
  "oldest",
  "name_a_z",
  "name_z_a",
] as const;
const VALID_PRICING = ["ALL", "free", "paid"] as const;
const PAGE_SIZE = 12;

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function asPage(value: unknown): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

interface CourseListPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CourseListPage({ searchParams }: CourseListPageProps) {
  const { user } = await getValidatedSession();
  const raw = await searchParams;

  if (!user) {
    redirect("/office/login?callbackUrl=/office/courses");
  }
  if (!canAccessOffice(user.role)) {
    redirect("/student/dashboard");
  }

  const canRead = hasPermission(user.role, PERMISSIONS.COURSES_READ);
  const canManage = hasPermission(user.role, PERMISSIONS.COURSES_CREATE);
  const canPublish = hasPermission(user.role, PERMISSIONS.COURSES_PUBLISH);
  const canUpdate = hasPermission(user.role, PERMISSIONS.COURSES_UPDATE);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardContent className="p-8 text-center text-sm text-slate-600">
            You do not have permission to manage courses.
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const get = (key: string) => raw[key] ?? undefined;
  const page = asPage(get("page"));

  const [result, categoryOptions] = await Promise.all([
    listCourses({
      session: user,
      filters: {
        search: typeof get("search") === "string" ? (get("search") as string) : "",
        status: asEnum(get("status"), VALID_STATUSES, "ALL"),
        categoryId: typeof get("categoryId") === "string" ? (get("categoryId") as string) : "",
        level: typeof get("level") === "string" ? (get("level") as string) : "",
        pricing: asEnum(get("pricing"), VALID_PRICING, "ALL"),
      },
      sort: asEnum(get("sort"), VALID_SORTS, "recently_updated"),
      page,
      pageSize: PAGE_SIZE,
    }),
    getCategoryOptions(),
  ]);

  const fmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Content studio</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Courses</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Create courses, build curriculum modules with YouTube &amp; PDF lessons, and control publishing.
            </p>
          </div>
          {canManage ? (
            <Link href="/office/courses/new" className={buttonVariants("primary", "md", "rounded-xl")}>
              <Plus className="h-4 w-4" aria-hidden="true" /> New course
            </Link>
          ) : null}
        </header>

        <Card className="overflow-hidden border-slate-200/80">
          <CardContent className="pt-6">
            <CourseListToolbar categories={categoryOptions} />
          </CardContent>
        </Card>

        {result.courses.length === 0 ? (
          <Card>
            <CardContent className="py-14 text-center">
              <Library className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">No courses found</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                {page > 1
                  ? "This page is empty. Try an earlier page or clear filters."
                  : canManage
                    ? "Create your first course to start building curriculum."
                    : "There are no courses to show."}
              </p>
              {page > 1 ? (
                <Link href="/office/courses" className={buttonVariants("outline", "md", "mt-5")}>
                  Clear filters
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {result.courses.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                canPublish={canPublish}
                canUpdate={canUpdate}
                updatedLabel={fmt.format(new Date(course.updatedAt))}
              />
            ))}
          </div>
        )}

        <Pagination
          basePath="/office/courses"
          currentPage={result.page}
          totalPages={result.totalPages}
          totalItems={result.total}
          query={raw}
        />
      </div>
    </OfficeShell>
  );
}

function CourseRow({
  course,
  canPublish,
  canUpdate,
  updatedLabel,
}: {
  course: OfficeCourseSummary;
  canPublish: boolean;
  canUpdate: boolean;
  updatedLabel: string;
}) {
  return (
    <Card className="overflow-hidden border-slate-200/80 transition-shadow hover:shadow-card-hover">
      <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-20 sm:w-32">
            {course.thumbnailUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              </>
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
                {course.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CourseStatusBadge status={course.status} />
              {course.isFree ? <Badge variant="secondary">Free</Badge> : null}
              <Badge variant="neutral">{course.level.replace("_", " ")}</Badge>
            </div>
            <Link
              href={`/office/courses/${course.id}`}
              className="mt-1.5 block truncate text-base font-semibold text-slate-900 hover:text-primary-700"
            >
              {course.name}
            </Link>
            <p className="mt-0.5 truncate text-sm text-slate-500">{course.categoryName}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-96">
          <Stat icon={Layers} value={course.moduleCount} label="Modules" />
          <Stat icon={PlaySquare} value={course.lessonCount} label="Lessons" />
          <Stat icon={Users} value={course.enrollmentCount} label="Enrolled" />
          <div className="rounded-lg bg-slate-50 px-2.5 py-2">
            <p className="flex items-center gap-1 text-sm font-semibold text-slate-800">
              {course.isFree ? (
                "Free"
              ) : (
                <>
                  <IndianRupee className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  {course.price ?? 0}
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-500">Price</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Link href={`/office/courses/${course.id}`} className={buttonVariants("outline", "sm")}>
            Manage <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <CourseStatusActions
            courseId={course.id}
            courseName={course.name}
            status={course.status}
            canPublish={canPublish}
            canUpdate={canUpdate}
            enrollmentCount={course.enrollmentCount}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Layers;
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2.5 py-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
        {value}
      </p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function Pagination({
  basePath,
  currentPage,
  totalPages,
  totalItems,
  query,
}: {
  basePath: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  query: Record<string, string | string[] | undefined>;
}) {
  const keep = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (key === "page") continue;
    if (typeof value === "string" && value) keep.set(key, value);
  }
  const hrefFor = (page: number) => {
    const params = new URLSearchParams(keep.toString());
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav className="flex items-center justify-between gap-3 text-sm text-slate-600" aria-label="Pagination">
      <p>
        {totalItems} course{totalItems !== 1 ? "s" : ""}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1.5">
          <Link
            href={hrefFor(currentPage - 1)}
            aria-disabled={currentPage <= 1}
            className={buttonVariants("outline", "sm", currentPage <= 1 ? "pointer-events-none opacity-50" : "")}
          >
            Previous
          </Link>
          <span className="px-1 text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={hrefFor(currentPage + 1)}
            aria-disabled={currentPage >= totalPages}
            className={buttonVariants("outline", "sm", currentPage >= totalPages ? "pointer-events-none opacity-50" : "")}
          >
            Next
          </Link>
        </div>
      ) : null}
    </nav>
  );
}
