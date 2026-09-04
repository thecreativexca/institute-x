import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SettingsForm } from "@/components/office/settings/settings-form";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice } from "@/lib/auth/permissions";
import { getInstituteSettings, getIntegrationStatus } from "@/lib/office/settings";

export const metadata: Metadata = { title: "Settings — Office Portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const { user } = await getValidatedSession(); if (!user) redirect("/office/login?callbackUrl=/office/settings"); if (!canAccessOffice(user.role)) redirect("/student/dashboard");
  const [initial, status] = await Promise.all([getInstituteSettings(), Promise.resolve(getIntegrationStatus())]);
  return <OfficeShell session={user}><div className="space-y-6"><header className="office-page-header"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Configuration</p><h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">Institute settings</h1><p className="mt-1 text-sm text-slate-600">Manage branding, defaults, integrations and policy content without exposing secrets.</p></header><SettingsForm initial={initial} status={status} /></div></OfficeShell>;
}
