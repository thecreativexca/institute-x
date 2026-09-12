"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Building2, CreditCard, Mail, Palette, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { saveInstituteSettingsAction } from "@/lib/office/settings-actions";

interface SettingsValue {
  instituteName: string; portalName: string; logoUrl: string; faviconUrl: string; email: string; phone: string; address: string; website: string;
  facebook: string; instagram: string; youtube: string; linkedin: string; defaultCurrency: string; defaultCourseAccessDays: number | null;
  certificateHeading: string; certificateSignatoryName: string; certificateSignatoryDesignation: string; senderName: string; senderEmail: string;
  privacyPolicy: string; termsAndConditions: string; refundPolicy: string;
}

export function SettingsForm({ initial, status }: { initial: SettingsValue; status: { payments: boolean; email: boolean; uploads: boolean } }) {
  const [form, setForm] = useState(initial); const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const update = <K extends keyof SettingsValue>(key: K, value: SettingsValue[K]) => setForm((current) => ({ ...current, [key]: value }));
  function submit() { startTransition(async () => { const result = await saveInstituteSettingsAction(form); setErrors(result.fieldErrors ?? {}); setNotice({ ok: result.ok, text: result.message ?? result.error ?? "Review the highlighted fields." }); }); }
  return <div className="space-y-5">
    {notice ? <div role={notice.ok ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.ok ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.text}</div> : null}
    <Section icon={Building2} title="Institute" description="Public identity and contact information."><div className="grid gap-4 sm:grid-cols-2">
      <Text id="instituteName" label="Institute name" value={form.instituteName} error={errors.instituteName} onChange={(v) => update("instituteName", v)} />
      <Text id="portalName" label="Portal short name" value={form.portalName} error={errors.portalName} onChange={(v) => update("portalName", v)} />
      <Text id="email" label="Contact email" value={form.email} error={errors.email} onChange={(v) => update("email", v)} type="email" />
      <Text id="phone" label="Phone" value={form.phone} error={errors.phone} onChange={(v) => update("phone", v)} />
      <Text id="website" label="Website" value={form.website} error={errors.website} onChange={(v) => update("website", v)} />
      <div className="sm:col-span-2"><Area id="address" label="Address" value={form.address} error={errors.address} onChange={(v) => update("address", v)} /></div>
    </div></Section>
    <Section icon={Palette} title="Branding & social" description="Use secure HTTPS asset URLs. Upload credentials remain server-side."><div className="grid gap-4 sm:grid-cols-2">
      {(["logoUrl", "faviconUrl", "facebook", "instagram", "youtube", "linkedin"] as const).map((key) => <Text key={key} id={key} label={({ logoUrl: "Logo URL", faviconUrl: "Favicon URL", facebook: "Facebook URL", instagram: "Instagram URL", youtube: "YouTube URL", linkedin: "LinkedIn URL" })[key]} value={form[key]} error={errors[key]} onChange={(v) => update(key, v)} />)}
    </div></Section>
    <Section icon={BadgeCheck} title="Course & certificates" description="Defaults used for new courses and certificate presentation."><div className="grid gap-4 sm:grid-cols-2">
      <Text id="defaultCurrency" label="Default currency" value={form.defaultCurrency} error={errors.defaultCurrency} onChange={(v) => update("defaultCurrency", v.toUpperCase().slice(0, 3))} />
      <FieldShell id="accessDays" label="Default access days" optionalLabel="empty = lifetime" error={errors.defaultCourseAccessDays}><input id="accessDays" type="number" min={1} value={form.defaultCourseAccessDays ?? ""} onChange={(e) => update("defaultCourseAccessDays", e.target.value ? Number(e.target.value) : null)} className={controlClassName(Boolean(errors.defaultCourseAccessDays), "h-10")} /></FieldShell>
      <Text id="certificateHeading" label="Certificate heading" value={form.certificateHeading} error={errors.certificateHeading} onChange={(v) => update("certificateHeading", v)} />
      <Text id="certificateSignatoryName" label="Signatory name" value={form.certificateSignatoryName} error={errors.certificateSignatoryName} onChange={(v) => update("certificateSignatoryName", v)} />
      <Text id="certificateSignatoryDesignation" label="Signatory designation" value={form.certificateSignatoryDesignation} error={errors.certificateSignatoryDesignation} onChange={(v) => update("certificateSignatoryDesignation", v)} />
    </div></Section>
    <div className="grid gap-5 xl:grid-cols-2"><Section icon={CreditCard} title="Payments & uploads" description="Secrets are never sent to this page."><Status label="Razorpay" ready={status.payments} /><Status label="Cloudinary uploads" ready={status.uploads} /></Section><Section icon={Mail} title="Email" description="Sender defaults and secure provider status."><div className="grid gap-4"><Status label="Resend integration" ready={status.email} /><Text id="senderName" label="Sender name" value={form.senderName} error={errors.senderName} onChange={(v) => update("senderName", v)} /><Text id="senderEmail" label="Sender email" value={form.senderEmail} error={errors.senderEmail} onChange={(v) => update("senderEmail", v)} type="email" /></div></Section></div>
    <Section icon={Scale} title="Legal policies" description="Policy copy shown across public checkout and legal pages."><div className="grid gap-4"><Area id="privacyPolicy" label="Privacy Policy" value={form.privacyPolicy} error={errors.privacyPolicy} onChange={(v) => update("privacyPolicy", v)} /><Area id="termsAndConditions" label="Terms & Conditions" value={form.termsAndConditions} error={errors.termsAndConditions} onChange={(v) => update("termsAndConditions", v)} /><Area id="refundPolicy" label="Refund Policy" value={form.refundPolicy} error={errors.refundPolicy} onChange={(v) => update("refundPolicy", v)} /></div></Section>
    <div className="sticky bottom-4 flex justify-end"><Button size="lg" isLoading={pending} onClick={submit}>Save all settings</Button></div>
  </div>;
}

function Section({ icon: Icon, title, description, children }: { icon: typeof Building2; title: string; description: string; children: React.ReactNode }) { return <Card><CardContent className="p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon className="h-5 w-5" /></span><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="mt-0.5 text-sm text-slate-500">{description}</p></div></div>{children}</CardContent></Card>; }
function Text({ id, label, value, error, onChange, type = "text" }: { id: string; label: string; value: string; error?: string; onChange: (value: string) => void; type?: string }) { return <FieldShell id={id} label={label} error={error}><input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} className={controlClassName(Boolean(error), "h-10")} /></FieldShell>; }
function Area({ id, label, value, error, onChange }: { id: string; label: string; value: string; error?: string; onChange: (value: string) => void }) { return <FieldShell id={id} label={label} error={error}><textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} className={controlClassName(Boolean(error), "min-h-28 py-2")} /></FieldShell>; }
function Status({ label, ready }: { label: string; ready: boolean }) { return <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"><span className="font-medium text-slate-700">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-amber-100 text-amber-900" : "bg-amber-100 text-amber-800"}`}>{ready ? "Configured" : "Needs configuration"}</span></div>; }
