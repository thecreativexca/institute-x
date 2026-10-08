import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Mail, MessageSquareText, Phone, UserRoundCheck } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { cn } from "@/lib/utils/cn";
import { AdmissionRequest, type AdmissionRequestStatus, type AdmissionRequestType } from "@/models/AdmissionRequest";
import { updateAdmissionRequestStatus } from "./actions";

export const metadata: Metadata = { title: "Admission Requests — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Params = Record<string, string | string[] | undefined>;

export default async function AdmissionRequestsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { user } = await requireAdmin();
  if (!user) return null;
  const params = await searchParams;
  const status = one(params.status);
  const type = one(params.type);
  const search = one(params.search).trim();
  const page = Math.max(1, Number.parseInt(one(params.page), 10) || 1);
  const pageSize = 20;
  const filter: Record<string, unknown> = {};

  if (["new", "contacted", "closed"].includes(status)) filter.status = status;
  if (["contact", "enrollment"].includes(type)) filter.type = type;
  if (search) {
    const pattern = new RegExp(escapeRegExp(search), "i");
    filter.$or = [{ fullName: pattern }, { phone: pattern }, { email: pattern }, { courseName: pattern }];
  }

  await connectDB();
  const [rows, total, totalNew, totalContacted, totalClosed] = await Promise.all([
    AdmissionRequest.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).lean(),
    AdmissionRequest.countDocuments(filter),
    AdmissionRequest.countDocuments({ status: "new" }),
    AdmissionRequest.countDocuments({ status: "contacted" }),
    AdmissionRequest.countDocuments({ status: "closed" }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Admissions inbox</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Contact &amp; enrollment requests</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Every request submitted from the public contact form or a course page appears here.</p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Request summary">
          <Summary icon={MessageSquareText} label="All requests" value={totalNew + totalContacted + totalClosed} />
          <Summary icon={Clock3} label="New" value={totalNew} tone="text-amber-700 bg-amber-50" />
          <Summary icon={UserRoundCheck} label="Contacted" value={totalContacted} tone="text-blue-700 bg-blue-50" />
          <Summary icon={CheckCircle2} label="Closed" value={totalClosed} tone="text-emerald-700 bg-emerald-50" />
        </section>

        <Card><CardContent className="p-4 sm:pt-4">
          <form method="GET" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_auto_auto] md:items-end">
            <label className="text-sm font-medium text-slate-700">Search<input name="search" defaultValue={search} placeholder="Name, phone, email or course…" className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
            <label className="text-sm font-medium text-slate-700">Type<select name="type" defaultValue={type} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All types</option><option value="enrollment">Enrollment</option><option value="contact">Contact</option></select></label>
            <label className="text-sm font-medium text-slate-700">Status<select name="status" defaultValue={status} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"><option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label>
            <button className={buttonVariants("primary", "md")}>Apply</button>
            <Link href="/office/requests" className={buttonVariants("outline", "md")}>Clear</Link>
          </form>
        </CardContent></Card>

        {rows.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {rows.map((row) => (
              <Card key={row._id.toString()} className="overflow-hidden border-slate-200/80">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", row.type === "enrollment" ? "bg-primary-100 text-primary-800" : "bg-violet-100 text-violet-800")}>{typeLabel(row.type)}</span>
                        <StatusBadge status={row.status} />
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-slate-900">{row.fullName}</h2>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(row.createdAt)}</p>
                    </div>
                    <span className="text-xs font-medium text-slate-400">#{row._id.toString().slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="flex flex-wrap gap-2">
                      <a href={`tel:${row.phone.replace(/[^+\d]/g, "")}`} className={buttonVariants("primary", "sm")}><Phone className="h-4 w-4" /> {row.phone}</a>
                      {row.email ? <a href={`mailto:${row.email}`} className={buttonVariants("outline", "sm")}><Mail className="h-4 w-4" /> Email</a> : null}
                    </div>
                    {row.courseName ? <div className="rounded-xl bg-primary-50 px-4 py-3"><p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Course</p><p className="mt-1 font-semibold text-primary-950">{row.courseName}</p></div> : null}
                    {row.message ? <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{row.message}</p></div> : null}
                    <form action={updateAdmissionRequestStatus} className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                      <input type="hidden" name="requestId" value={row._id.toString()} />
                      <span className="mr-auto text-xs font-medium text-slate-500">Update status</span>
                      {row.status !== "new" ? <button name="status" value="new" className={buttonVariants("ghost", "sm")}>Mark new</button> : null}
                      {row.status !== "contacted" ? <button name="status" value="contacted" className={buttonVariants("outline", "sm")}>Contacted</button> : null}
                      {row.status !== "closed" ? <button name="status" value="closed" className={buttonVariants("primary", "sm")}>Close</button> : null}
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card><CardContent className="py-16 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-semibold text-slate-900">No requests found</h2><p className="mt-1 text-sm text-slate-500">New website requests will appear here automatically.</p></CardContent></Card>
        )}

        {totalPages > 1 ? <nav className="flex items-center justify-between text-sm text-slate-600"><span>{total} requests</span><div className="flex items-center gap-2"><Link href={pageHref(params, page - 1)} className={buttonVariants("outline", "sm", page <= 1 ? "pointer-events-none opacity-50" : "")}>Previous</Link><span>Page {page} of {totalPages}</span><Link href={pageHref(params, page + 1)} className={buttonVariants("outline", "sm", page >= totalPages ? "pointer-events-none opacity-50" : "")}>Next</Link></div></nav> : null}
      </div>
    </OfficeShell>
  );
}

function Summary({ icon: Icon, label, value, tone = "text-primary-700 bg-primary-50" }: { icon: typeof MessageSquareText; label: string; value: number; tone?: string }) {
  return <Card><CardContent className="flex items-center gap-3 p-4 sm:pt-4"><span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone)}><Icon className="h-5 w-5" /></span><div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></CardContent></Card>;
}

function StatusBadge({ status }: { status: AdmissionRequestStatus }) {
  const style = status === "new" ? "bg-amber-100 text-amber-800" : status === "contacted" ? "bg-blue-100 text-blue-800" : "bg-emerald-100 text-emerald-800";
  return <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide", style)}>{status}</span>;
}

function typeLabel(type: AdmissionRequestType) { return type === "enrollment" ? "Enrollment" : "Contact"; }
function one(value: string | string[] | undefined) { return typeof value === "string" ? value : ""; }
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function formatDate(value: Date) { return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)); }
function pageHref(params: Params, page: number) { const query = new URLSearchParams(); for (const [key, value] of Object.entries(params)) if (key !== "page" && typeof value === "string" && value) query.set(key, value); if (page > 1) query.set("page", String(page)); return query.size ? `/office/requests?${query}` : "/office/requests"; }
