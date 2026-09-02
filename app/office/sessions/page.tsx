import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { listOfficeSessions, getSessionCourseOptions } from "@/lib/office/sessions/queries";
import { SESSION_STATUSES } from "@/lib/constants";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SessionsManager } from "@/components/office/sessions/sessions-manager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Sessions — Office Portal",
  description: "Schedule and manage offline / venue classes for your courses.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["scheduled", "completed", "cancelled", "ALL"] as const;

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

interface SessionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SessionsPage({ searchParams }: SessionsPageProps) {
  const { user } = await getValidatedSession();
  const raw = await searchParams;
  if (!user) redirect("/office/login?callbackUrl=/office/sessions");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canManage = hasPermission(user.role, PERMISSIONS.SESSIONS_MANAGE);

  const [result, courseOptions] = await Promise.all([
    listOfficeSessions({
      session: user,
      filters: {
        courseId: str(raw.course),
        status: asEnum(raw.status, VALID_STATUSES, "ALL"),
      },
    }),
    getSessionCourseOptions(),
  ]);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Classes</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Sessions</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Offline / venue classes scheduled against your courses — room, date and timings that enrolled
              students see in their portal.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            <MapPin className="h-5 w-5 text-primary-600" aria-hidden="true" />
            <span>Venue-based classes</span>
          </div>
        </header>

        <Card className="border-slate-200/80">
          <CardContent className="pt-5">
            <form method="get" action="/office/sessions" className="flex flex-wrap items-end gap-3">
              <label className="flex min-w-40 flex-col gap-1 text-xs font-medium text-slate-600">
                Course
                <select
                  name="course"
                  defaultValue={str(raw.course)}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500"
                >
                  <option value="">All courses</option>
                  {courseOptions.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex min-40 flex-col gap-1 text-xs font-medium text-slate-600">
                Status
                <select
                  name="status"
                  defaultValue={asEnum(raw.status, VALID_STATUSES, "ALL")}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500"
                >
                  <option value="ALL">All statuses</option>
                  <option value={SESSION_STATUSES.SCHEDULED}>Scheduled</option>
                  <option value={SESSION_STATUSES.COMPLETED}>Completed</option>
                  <option value={SESSION_STATUSES.CANCELLED}>Cancelled</option>
                </select>
              </label>
              <Button type="submit" variant="secondary" size="md">Apply filters</Button>
              {str(raw.course) || str(raw.status) ? (
                <Link href="/office/sessions" className="text-sm font-medium text-slate-500 hover:text-slate-800">
                  Clear
                </Link>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <SessionsManager sessions={result.sessions} courseOptions={courseOptions} canManage={canManage} />
      </div>
    </OfficeShell>
  );
}
