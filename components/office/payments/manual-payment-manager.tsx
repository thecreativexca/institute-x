"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PaymentEnrollmentOption } from "@/lib/office/payments/dto";
import { addManualPaymentAction } from "@/lib/office/payments/mutations";
import { formatCurrency } from "@/lib/payments/format";

const methods = [
  ["cash", "Cash"], ["cheque", "Cheque"], ["upi", "UPI"],
  ["bank_transfer", "Bank Transfer"], ["other", "Other"],
] as const;

interface UploadedProof { url: string; publicId: string; fileName: string; mimeType: string; size: number }

export function ManualPaymentManager({ options }: { options: PaymentEnrollmentOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<(typeof methods)[number][0]>("cash");
  const [enrollmentId, setEnrollmentId] = useState(options[0]?.enrollmentId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [proof, setProof] = useState<UploadedProof | null>(null);
  const [uploading, setUploading] = useState(false);
  const selected = useMemo(() => options.find((option) => option.enrollmentId === enrollmentId), [options, enrollmentId]);

  async function uploadProof(file: File) {
    setUploading(true); setNotice(null);
    const body = new FormData(); body.set("file", file);
    try {
      const response = await fetch("/api/office/payments/proof", { method: "POST", body });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Upload failed.");
      setProof(data.file);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Upload failed.");
    } finally { setUploading(false); }
  }

  function submit(form: FormData) {
    startTransition(async () => {
      setErrors({}); setNotice(null);
      const result = await addManualPaymentAction({
        enrollmentId: String(form.get("enrollmentId") || ""),
        amount: Number(form.get("amount")),
        paymentDate: String(form.get("paymentDate") || ""),
        paymentMethod: String(form.get("paymentMethod")) as "cash",
        transactionReference: String(form.get("transactionReference") || ""),
        chequeNumber: String(form.get("chequeNumber") || ""),
        chequeDate: String(form.get("chequeDate") || ""),
        bankName: String(form.get("bankName") || ""),
        upiReference: String(form.get("upiReference") || ""),
        notes: String(form.get("notes") || ""),
        status: String(form.get("status")) as "pending",
        paymentProof: proof,
      });
      if (!result.ok) { setErrors(result.fieldErrors ?? {}); setNotice(result.error ?? "Review the form."); return; }
      setOpen(false); setProof(null); setNotice(null);
    });
  }

  return <>
    <Button onClick={() => setOpen(true)} disabled={options.length === 0}><Plus className="h-4 w-4" /> Add Payment</Button>
    <Modal open={open} onClose={() => !pending && setOpen(false)} title="Add manual payment" description="Record money received outside the website. Verification remains under admin control." className="max-w-3xl">
      <form action={submit} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
        {notice ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{notice}</p> : null}
        <Field label="Student and course" error={errors.enrollmentId}>
          <select name="enrollmentId" required value={enrollmentId} onChange={(event) => setEnrollmentId(event.target.value)} className={control}>
            {options.map((option) => <option key={option.enrollmentId} value={option.enrollmentId}>{option.studentName} · {option.courseName} · available {formatCurrency(option.recordableAmount, option.currency)}</option>)}
          </select>
        </Field>
        {selected ? <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-4"><span>Fee <strong className="block text-slate-900">{formatCurrency(selected.totalFee, selected.currency)}</strong></span><span>Paid <strong className="block text-slate-900">{formatCurrency(selected.totalPaid, selected.currency)}</strong></span><span>Pending <strong className="block text-slate-900">{formatCurrency(selected.pendingAmount, selected.currency)}</strong></span><span>Available <strong className="block text-slate-900">{formatCurrency(selected.recordableAmount, selected.currency)}</strong></span></div> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount (₹)" error={errors.amount}><input name="amount" type="number" min="0.01" step="0.01" max={selected ? selected.recordableAmount / 100 : undefined} required className={control} /></Field>
          <Field label="Payment date" error={errors.paymentDate}><input name="paymentDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={control} /></Field>
          <Field label="Payment method"><select name="paymentMethod" value={method} onChange={(event) => setMethod(event.target.value as typeof method)} className={control}>{methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label="Payment status"><select name="status" defaultValue="pending" className={control}><option value="pending">Pending verification</option><option value="verified">Verified</option></select></Field>
          {method === "cheque" ? <><Field label="Cheque number" error={errors.chequeNumber}><input name="chequeNumber" required className={control} /></Field><Field label="Bank name" error={errors.bankName}><input name="bankName" required className={control} /></Field><Field label="Cheque date" error={errors.chequeDate}><input name="chequeDate" type="date" required className={control} /></Field></> : null}
          {method === "upi" ? <Field label="UPI transaction ID" error={errors.upiReference}><input name="upiReference" required className={control} /></Field> : null}
          {method === "bank_transfer" ? <Field label="Bank reference number" error={errors.transactionReference}><input name="transactionReference" required className={control} /></Field> : null}
          {method === "other" ? <Field label="Reference number"><input name="transactionReference" className={control} /></Field> : null}
          <Field label="Payment proof (optional)"><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadProof(file); }} className="block w-full text-sm text-slate-600" />{uploading ? <small>Uploading…</small> : proof ? <small className="text-emerald-700">Uploaded: {proof.fileName}</small> : null}</Field>
        </div>
        <Field label="Notes"><textarea name="notes" rows={3} className={control} /></Field>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button><Button type="submit" isLoading={pending} disabled={uploading || !enrollmentId}>Save payment</Button></div>
      </form>
    </Modal>
  </>;
}

const control = "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20";
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="block text-sm font-medium text-slate-700">{label}<span className="mt-1.5 block">{children}</span>{error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}</label>; }
