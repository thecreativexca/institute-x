import type { Metadata } from "next";
import { BadgeIndianRupee, CirclePercent, Tag, TicketCheck } from "lucide-react";

import { CouponsManager } from "@/components/office/coupons/coupons-manager";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import { getCouponsAdminData } from "@/lib/office/coupons/queries";

export const metadata: Metadata = { title: "Coupons — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const { user } = await requireAdmin();
  if (!user) return null;
  const data = await getCouponsAdminData();
  const active = data.coupons.filter((coupon) => coupon.isActive && (!coupon.expiresAt || new Date(`${coupon.expiresAt}T23:59:59`) >= new Date())).length;
  const uses = data.coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);
  return <OfficeShell session={user}><div className="space-y-6">
    <header className="office-page-header"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Revenue tools</p><h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Coupons</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Create course-specific or catalog-wide discounts with date and usage controls.</p></header>
    <section className="grid gap-3 sm:grid-cols-3"><Summary icon={Tag} label="Total coupons" value={data.coupons.length} /><Summary icon={TicketCheck} label="Currently active" value={active} /><Summary icon={BadgeIndianRupee} label="Completed uses" value={uses} /></section>
    <CouponsManager {...data} />
  </div></OfficeShell>;
}

function Summary({ icon: Icon, label, value }: { icon: typeof CirclePercent; label: string; value: number }) {
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon className="h-5 w-5" /></span><div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></CardContent></Card>;
}
