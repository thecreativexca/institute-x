import type { Metadata } from "next";
import { Award, BadgeCheck, Ban } from "lucide-react";
import { CertificateManager } from "@/components/office/certificates/certificate-manager";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Certificate } from "@/models/Certificate";

export const metadata: Metadata = { title: "Certificates — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function CertificatesPage() {
  const { user } = await requireAdmin(); if (!user) return null; await connectDB();
  const rows = await Certificate.find({}).sort({ issuedAt: -1 }).limit(250).lean();
  const certificates = rows.map((row) => ({ id: row._id.toString(), certificateNumber: row.certificateNumber, verificationCode: row.verificationCode, studentName: row.studentNameSnapshot, courseName: row.courseNameSnapshot, issuedAt: row.issuedAt.toISOString(), status: row.status, pdfUrl: row.pdfUrl, revocationReason: row.revocationReason ?? null }));
  const issued = certificates.filter((certificate) => certificate.status === "issued").length;
  return <OfficeShell session={user}><div className="space-y-6"><header className="office-page-header"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Credentials</p><h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Certificates</h1><p className="mt-1 text-sm text-slate-600">Review issued credentials and revoke invalid certificates with a permanent audit trail.</p></header><section className="grid gap-3 sm:grid-cols-3"><Summary icon={Award} label="Total" value={certificates.length} /><Summary icon={BadgeCheck} label="Valid" value={issued} /><Summary icon={Ban} label="Revoked" value={certificates.length - issued} /></section>{certificates.length ? <CertificateManager certificates={certificates} /> : <EmptyState icon={<Award className="h-10 w-10" />} title="No certificates issued" description="Certificates appear here after eligible course completions." />}</div></OfficeShell>;
}
function Summary({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: number }) { return <Card><CardContent className="flex items-center gap-3 p-4"><Icon className="h-5 w-5 text-primary-700" /><div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></CardContent></Card>; }
