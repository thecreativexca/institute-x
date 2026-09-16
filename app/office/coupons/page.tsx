import type { Metadata } from "next";

import { CouponsManager } from "@/components/office/coupons/coupons-manager";
import { OfficeShell } from "@/components/office/OfficeShell";
import { requireAdmin } from "@/lib/auth/helpers";
import { getCouponsAdminData } from "@/lib/office/coupons/queries";

export const metadata: Metadata = { title: "Coupons — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  const { user } = await requireAdmin();
  if (!user) return null;
  const data = await getCouponsAdminData();
  const active = data.coupons.filter(
    (coupon) =>
      coupon.isActive &&
      (!coupon.expiresAt || new Date(`${coupon.expiresAt}T23:59:59`) >= new Date())
  ).length;
  const uses = data.coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);

  return (
    <OfficeShell session={user}>
      <CouponsManager {...data} activeCount={active} usesCount={uses} />
    </OfficeShell>
  );
}
