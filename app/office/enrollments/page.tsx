import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheckBig, ContactRound, GraduationCap, ShieldX } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { EnrollmentsManager } from "@/components/office/enrollments/enrollments-manager";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import { getEnrollmentCourseOptions, listEnrollments } from "@/lib/office/enrollments/queries";

export const metadata: Metadata = { title: "Enrollments — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EnrollmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { user } = await requireAdmin();
  if (!user) return null;
  const params = await searchParams;
  const search = single(params.search);
  const status = single(params.status) || "all";
  const source = single(params.source) || "all";
  const page = Math.max(1, Number.parseInt(single(params.page), 10) || 1);
  const [result, courses] = await Promise.all([listEnrollments({ search, status, source, page, pageSize: 20 }), getEnrollmentCourseOptions()]);
  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Student access</p><h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Enrollments</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Review purchased, free and manually granted course access. Revoke or extend access without changing payment history.</p></header>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Enrollment summary">
          <Summary icon={ContactRound} label="Total" value={result.summary.total} />
          <Summary icon={CircleCheckBig} label="Active" value={result.summary.active} />
          <Summary icon={GraduationCap} label="Completed" value={result.summary.completed} />
          <Summary icon={ShieldX} label="Expired / cancelled" value={result.summary.expiredOrCancelled} />
        </section>
        <Card><CardContent className="p-4"><form method="GET" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_12rem_auto_auto] md:items-end"><label className="text-sm font-medium text-slate-700">Search<input name="search" defaultValue={search} placeholder="Student, email or course…" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label><label className="text-sm font-medium text-slate-700">Status<select name="status" defaultValue={status} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">All</option><option value="active">Active</option><option value="completed">Completed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></label><label className="text-sm font-medium text-slate-700">Source<select name="source" defaultValue={source} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="all">All</option><option value="razorpay">Razorpay</option><option value="free_course">Free course</option><option value="admin_manual">Admin manual</option></select></label><button className={buttonVariants("primary", "md")}>Apply</button><Link href="/office/enrollments" className={buttonVariants("outline", "md")}>Clear</Link></form></CardContent></Card>
        <EnrollmentsManager enrollments={result.enrollments} courses={courses} />
        <nav className="flex items-center justify-between text-sm text-slate-600" aria-label="Enrollment pagination"><span>{result.total} enrollments</span>{result.totalPages > 1 ? <div className="flex items-center gap-2"><Link href={pageHref(params, page - 1)} className={buttonVariants("outline", "sm", page <= 1 ? "pointer-events-none opacity-50" : "")}>Previous</Link><span>Page {page} of {result.totalPages}</span><Link href={pageHref(params, page + 1)} className={buttonVariants("outline", "sm", page >= result.totalPages ? "pointer-events-none opacity-50" : "")}>Next</Link></div> : null}</nav>
      </div>
    </OfficeShell>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof ContactRound; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon className="h-5 w-5" /></span><div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></CardContent></Card>; }
function single(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
function pageHref(params: Record<string, string | string[] | undefined>, page: number) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) if (key !== "page" && typeof value === "string" && value) query.set(key, value); if (page > 1) query.set("page", String(page)); return query.size ? `/office/enrollments?${query}` : "/office/enrollments"; }
