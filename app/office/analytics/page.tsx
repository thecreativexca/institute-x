import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { loadReport } from "@/lib/analytics/loader";
import { getRevenueAnalytics } from "@/lib/analytics/revenue";
import { getEnrollmentAnalytics } from "@/lib/analytics/enrollments";
import { getStudentAnalytics } from "@/lib/analytics/students";
import { getCoursePerformance } from "@/lib/analytics/courses";
import {
  formatCurrencyFromPaise,
  formatNumber,
  formatPercentage,
} from "@/lib/analytics/format";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TrendingUp,
  Wallet,
  Users,
  GraduationCap,
  ArrowRight,
  Activity,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics — Office Portal",
  description: "Revenue, enrollment and content performance insights.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
] as const;

function str(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

interface AnalyticsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const { user } = await getValidatedSession();
  const raw = await searchParams;
  if (!user) redirect("/office/login?callbackUrl=/office/analytics");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const canRead = hasPermission(user.role, PERMISSIONS.ANALYTICS_READ);
  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardContent className="p-8 text-center text-sm text-slate-600">
            You do not have permission to view analytics.
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const loaded = await loadReport(user, raw);
  const ctx = loaded.ctx;

  const [revenue, enrollments, students, coursePerformance] = await Promise.all([
    getRevenueAnalytics(ctx),
    getEnrollmentAnalytics(ctx),
    getStudentAnalytics(ctx),
    getCoursePerformance(ctx),
  ]);

  const activeRange =
    RANGE_OPTIONS.find((option) => option.value === (str(raw.range) || str(raw.preset)))?.value ??
    "30d";

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Insights</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Analytics</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Revenue, enrollments and course performance for the institute. All figures are reported in
              Asia/Kolkata.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            {RANGE_OPTIONS.map((option) => {
              const active = activeRange === option.value;
              return (
                <Link
                  key={option.value}
                  href={`/office/analytics?range=${option.value}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
          <KpiTile icon={Wallet} label="Gross revenue" value={formatCurrencyFromPaise(revenue.grossPaise)} sub={`${revenue.paidCount} paid orders`} />
          <KpiTile icon={TrendingUp} label="Net revenue" value={formatCurrencyFromPaise(revenue.netPaise)} sub={`${formatNumber(revenue.refundedPaise / 100, 0)} refunded`} />
          <KpiTile icon={Activity} label="Avg order value" value={formatCurrencyFromPaise(revenue.averageOrderValuePaise)} sub={`${formatPercentage(revenue.successRate, 0)} success rate`} />
          <KpiTile icon={GraduationCap} label="New enrollments" value={formatNumber(enrollments.new)} sub={`${formatNumber(enrollments.total)} total`} />
          <KpiTile icon={Users} label="New students" value={formatNumber(students.newRegistrations)} sub={`${formatNumber(students.totalStudents)} total`} />
          <KpiTile icon={TrendingUp} label="Active learners" value={formatNumber(enrollments.active)} sub={`${formatNumber(enrollments.completed)} completed`} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Revenue trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <BarChart
                rows={revenue.trend.map((point) => ({
                  label: point.label,
                  value: point.amountPaise,
                  display: formatCurrencyFromPaise(point.amountPaise),
                  count: point.count,
                }))}
                emptyTitle="No paid payments in this window"
              />
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Enrollment trend</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <BarChart
                rows={enrollments.trend.map((point) => ({
                  label: point.label,
                  value: point.count,
                  display: formatNumber(point.count),
                }))}
                emptyTitle="No enrollments in this window"
              />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Top courses by revenue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {revenue.byCourse.length === 0 ? (
                <EmptyState icon={<Wallet className="h-10 w-10" />} title="No paid revenue yet" description="Payments captured in this window will appear here." />
              ) : (
                revenue.byCourse.map((course) => {
                  const pct = revenue.grossPaise > 0 ? Math.round((course.grossPaise / revenue.grossPaise) * 100) : 0;
                  return (
                    <div key={course.courseId}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <p className="truncate font-medium text-slate-800">{course.courseName}</p>
                        <p className="shrink-0 font-semibold text-slate-900">{formatCurrencyFromPaise(course.grossPaise)}</p>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{course.paidEnrollments} paid · {pct}% of revenue</p>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="text-base">Payment status</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {revenue.statusBreakdown.length === 0 ? (
                <EmptyState icon={<Activity className="h-10 w-10" />} title="No payments in this window" />
              ) : (
                <ul className="space-y-3">
                  {revenue.statusBreakdown.map((row) => {
                    const pct = revenue.createdAtCount > 0 ? Math.round((row.count / revenue.createdAtCount) * 100) : 0;
                    return (
                      <li key={row.status}>
                        <div className="flex items-center justify-between text-sm">
                          <StatusBadge status={row.status} />
                          <span className="font-semibold text-slate-900">{formatNumber(row.count)}</span>
                        </div>
                        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-accent-400" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-base">
                Enrollments by course
                <Link href="/office/payments" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                  Orders <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    <th className="px-4 py-3 font-semibold text-right">New</th>
                    <th className="px-4 py-3 font-semibold text-right">Active</th>
                    <th className="px-4 py-3 font-semibold text-right">Completed</th>
                    <th className="px-4 py-3 font-semibold text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollments.byCourse.map((course) => (
                    <tr key={course.courseId} className="hover:bg-slate-50/70">
                      <td className="max-w-64 truncate px-4 py-3 font-medium text-slate-800">{course.courseName}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatNumber(course.new)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatNumber(course.active)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatNumber(course.completed)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatPercentage(course.completionRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200/80">
            <CardHeader className="border-b border-slate-100 bg-slate-50/60">
              <CardTitle className="flex items-center gap-2 text-base">
                Course health
                <Link href="/office/courses" className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                  Courses <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    <th className="px-4 py-3 font-semibold text-right">Enrollments</th>
                    <th className="px-4 py-3 font-semibold text-right">Completion</th>
                    <th className="px-4 py-3 font-semibold text-right">Avg progress</th>
                    <th className="px-4 py-3 font-semibold">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coursePerformance.courses.map((course) => (
                    <tr key={course.courseId} className="hover:bg-slate-50/70">
                      <td className="max-w-64 truncate px-4 py-3 font-medium text-slate-800">{course.courseName}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatNumber(course.enrollments)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatPercentage(course.completionRate)}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatPercentage(course.avgProgress, 0)}</td>
                      <td className="px-4 py-3"><HealthBadge health={course.health} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </OfficeShell>
  );
}

function BarChart({
  rows,
  emptyTitle,
}: {
  rows: { label: string; value: number; display: string; count?: number }[];
  emptyTitle: string;
}) {
  if (rows.length === 0) {
    return <EmptyState icon={<Activity className="h-10 w-10" />} title={emptyTitle} />;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  const mid = Math.ceil(rows.length / 2);
  return (
    <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      <MiniList rows={rows.slice(0, mid)} max={max} />
      {rows.length > mid ? <MiniList rows={rows.slice(mid)} max={max} /> : null}
    </div>
  );
}

function MiniList({ rows, max }: { rows: { label: string; value: number; display: string; count?: number }[]; max: number }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => {
        const pct = Math.max(2, Math.round((row.value / max) * 100));
        return (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            <span className="w-11 shrink-0 truncate text-xs text-slate-400">{compactLabel(row.label)}</span>
            <span className="h-5 min-w-0 flex-1 overflow-hidden rounded bg-slate-100">
              <span
                className="block h-full rounded bg-primary-400"
                style={{ width: `${pct}%` }}
                title={`${row.display}${row.count != null ? ` · ${row.count}` : ""}`}
              />
            </span>
            <span className="w-16 shrink-0 text-right text-xs font-medium text-slate-600">{row.display}</span>
          </li>
        );
      })}
    </ul>
  );
}

function compactLabel(label: string): string {
  const parts = label.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return label;
}

function KpiTile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200/80">
      <CardContent className="flex flex-col gap-1 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
          {label}
        </p>
        <p className="truncate text-base font-bold text-slate-900 sm:text-lg">{value}</p>
        <p className="truncate text-xs text-slate-400">{sub}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "paid" ? "success"
      : status === "refunded" ? "neutral"
        : status === "failed" ? "danger"
          : status === "pending" || status === "created" ? "warning"
            : "secondary";
  return <Badge variant={variant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
}

function HealthBadge({ health }: { health: "strong" | "attention" | "insufficient" | string }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
    strong: { label: "Strong", variant: "success" },
    attention: { label: "Needs attention", variant: "warning" },
    insufficient: { label: "Insufficient data", variant: "neutral" },
  };
  const meta = map[health] ?? { label: health, variant: "neutral" as const };
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}
