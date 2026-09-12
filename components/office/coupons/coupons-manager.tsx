"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Edit3, Plus, Power, PowerOff, Tag, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { deleteCouponAction, saveCouponAction, setCouponStatusAction } from "@/lib/office/coupons/actions";
import type { CouponActionResult, CouponCourseOption, CouponFormInput, CouponListItem } from "@/lib/office/coupons/dto";

const emptyForm: CouponFormInput = {
  code: "", type: "percentage", value: 10, minimumOrderValue: 0, maxDiscount: null,
  startsAt: "", expiresAt: "", usageLimit: null, perStudentUsageLimit: 1,
  applicableCourses: [], isActive: true,
};

export function CouponsManager({ coupons, courses }: { coupons: CouponListItem[]; courses: CouponCourseOption[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<CouponListItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<CouponListItem | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function finish(result: CouponActionResult, close?: () => void) {
    setNotice({ ok: result.ok, text: result.message ?? result.error ?? "Please review the highlighted fields." });
    setErrors(result.fieldErrors ?? {});
    if (result.ok) { close?.(); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => { setErrors({}); setEditing("new"); }}><Plus className="h-4 w-4" /> New coupon</Button></div>
      {notice ? <div role={notice.ok ? "status" : "alert"} className={`rounded-xl border px-4 py-3 text-sm font-medium ${notice.ok ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-800"}`}>{notice.text}</div> : null}
      {coupons.length === 0 ? (
        <EmptyState icon={<Tag className="h-10 w-10" />} title="No coupons yet" description="Create a coupon to offer a controlled checkout discount." action={<Button onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Create coupon</Button>} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {coupons.map((coupon) => {
            const expired = Boolean(coupon.expiresAt && new Date(`${coupon.expiresAt}T23:59:59`) < new Date());
            return <Card key={coupon.id}><CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><code className="rounded-lg bg-primary-50 px-2.5 py-1 text-base font-bold text-primary-800">{coupon.code}</code><Badge variant={coupon.isActive && !expired ? "success" : "neutral"}>{expired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}</Badge></div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value.toLocaleString("en-IN")} off`}</p>
                </div>
                <div className="text-right"><p className="text-lg font-bold text-slate-900">{coupon.usedCount}</p><p className="text-xs text-slate-500">uses{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</p></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-3">
                <span className="rounded-lg bg-slate-50 px-3 py-2">Min ₹{coupon.minimumOrderValue.toLocaleString("en-IN")}</span>
                <span className="rounded-lg bg-slate-50 px-3 py-2">{coupon.applicableCourses.length ? `${coupon.applicableCourses.length} courses` : "All courses"}</span>
                <span className="flex items-center gap-1 rounded-lg bg-slate-50 px-3 py-2"><Calendar className="h-3.5 w-3.5" /> {coupon.expiresAt || "No expiry"}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => { setErrors({}); setEditing(coupon); }}><Edit3 className="h-4 w-4" /> Edit</Button>
                <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => finish(await setCouponStatusAction(coupon.id, !coupon.isActive)))}>{coupon.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}{coupon.isActive ? "Deactivate" : "Activate"}</Button>
                <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50" disabled={coupon.usedCount > 0} onClick={() => setDeleting(coupon)}><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </CardContent></Card>;
          })}
        </div>
      )}
      {editing ? <CouponModal coupon={editing} courses={courses} pending={pending} errors={errors} onClose={() => !pending && setEditing(null)} onSubmit={(input) => startTransition(async () => finish(await saveCouponAction(editing === "new" ? null : editing.id, input), () => setEditing(null)))} /> : null}
      <Modal open={Boolean(deleting)} onClose={() => !pending && setDeleting(null)} title="Delete coupon?" description="Only coupons with no completed uses can be permanently deleted." footer={<><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="danger" isLoading={pending} onClick={() => deleting && startTransition(async () => finish(await deleteCouponAction(deleting.id), () => setDeleting(null)))}>Delete coupon</Button></>}><p className="text-sm text-slate-600">Delete <strong>{deleting?.code}</strong>? This cannot be undone.</p></Modal>
    </div>
  );
}

function CouponModal({ coupon, courses, pending, errors, onClose, onSubmit }: { coupon: CouponListItem | "new"; courses: CouponCourseOption[]; pending: boolean; errors: Record<string, string>; onClose: () => void; onSubmit: (value: CouponFormInput) => void }) {
  const [form, setForm] = useState<CouponFormInput>(coupon === "new" ? emptyForm : { ...coupon });
  const update = <K extends keyof CouponFormInput>(key: K, value: CouponFormInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  return <Modal open title={coupon === "new" ? "Create coupon" : "Edit coupon"} description="Discounts are revalidated securely when the payment order is created." className="max-h-[92vh] max-w-3xl overflow-y-auto" onClose={onClose} footer={<><Button variant="outline" disabled={pending} onClick={onClose}>Cancel</Button><Button isLoading={pending} onClick={() => onSubmit(form)}>Save coupon</Button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <FieldShell id="coupon-code" label="Coupon code" required error={errors.code}><input id="coupon-code" value={form.code} onChange={(e) => update("code", e.target.value.toUpperCase().replace(/\s/g, ""))} className={controlClassName(Boolean(errors.code), "h-10")} /></FieldShell>
      <FieldShell id="coupon-type" label="Discount type" required><select id="coupon-type" value={form.type} onChange={(e) => update("type", e.target.value as CouponFormInput["type"])} className={controlClassName(false, "h-10")}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></FieldShell>
      <NumberField id="coupon-value" label={form.type === "percentage" ? "Discount percentage" : "Discount amount (₹)"} value={form.value} error={errors.value} min={0.01} onChange={(v) => update("value", v)} />
      <NumberField id="coupon-min" label="Minimum order value (₹)" value={form.minimumOrderValue} error={errors.minimumOrderValue} min={0} onChange={(v) => update("minimumOrderValue", v)} />
      {form.type === "percentage" ? <NumberField id="coupon-cap" label="Maximum discount (₹, optional)" value={form.maxDiscount ?? ""} error={errors.maxDiscount} min={1} onChange={(v) => update("maxDiscount", v || null)} /> : null}
      <NumberField id="coupon-limit" label="Total usage limit (optional)" value={form.usageLimit ?? ""} error={errors.usageLimit} min={1} onChange={(v) => update("usageLimit", v || null)} />
      <NumberField id="coupon-per-user" label="Uses per student" value={form.perStudentUsageLimit} error={errors.perStudentUsageLimit} min={1} onChange={(v) => update("perStudentUsageLimit", v)} />
      <FieldShell id="coupon-start" label="Start date" optionalLabel="optional"><input id="coupon-start" type="date" value={form.startsAt} onChange={(e) => update("startsAt", e.target.value)} className={controlClassName(false, "h-10")} /></FieldShell>
      <FieldShell id="coupon-expiry" label="Expiry date" optionalLabel="optional" error={errors.expiresAt}><input id="coupon-expiry" type="date" value={form.expiresAt} onChange={(e) => update("expiresAt", e.target.value)} className={controlClassName(Boolean(errors.expiresAt), "h-10")} /></FieldShell>
      <div className="sm:col-span-2"><FieldShell id="coupon-courses" label="Applicable courses" optionalLabel="leave empty for all" error={errors.applicableCourses}><select id="coupon-courses" multiple value={form.applicableCourses} onChange={(e) => update("applicableCourses", Array.from(e.target.selectedOptions, (option) => option.value))} className={controlClassName(Boolean(errors.applicableCourses), "min-h-32 py-2")}>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select></FieldShell></div>
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 sm:col-span-2"><input type="checkbox" checked={form.isActive} onChange={(e) => update("isActive", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-700" /> Active and available at checkout</label>
    </div>
  </Modal>;
}

function NumberField({ id, label, value, error, min, onChange }: { id: string; label: string; value: number | string; error?: string; min: number; onChange: (value: number) => void }) {
  return <FieldShell id={id} label={label} error={error}><input id={id} type="number" min={min} step="0.01" value={value} onChange={(e) => onChange(Number(e.target.value))} className={controlClassName(Boolean(error), "h-10")} /></FieldShell>;
}
