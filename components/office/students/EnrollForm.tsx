"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldShell } from "@/components/ui/field";

interface EnrollFormProps {
  studentId: string;
  courses: Array<{ id: string; name: string; price: number | undefined; isFree: boolean }>;
}

export function EnrollForm({ studentId, courses }: EnrollFormProps) {
  const router = useRouter();
  const [courseId, setCourseId] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!courseId) {
      setError("Please select a course.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/office/students/${studentId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, source, reason: reason.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        router.push(`/office/students/${studentId}`);
      } else {
        setError(data.error || "Failed to create enrollment. Please try again.");
      }
    } catch {
      setError("Failed to create enrollment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

      return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <FieldShell id="course" label="Course">
          <select
            id="course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
          >
            <option value="">Select a course…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.isFree ? "Free" : `₹${c.price}`}
              </option>
            ))}
          </select>
        </FieldShell>
        <p className="text-xs text-slate-500">
          Only published courses the student is not already enrolled in are shown.
        </p>
      </div>

      <div className="space-y-2">
        <FieldShell id="source" label="Enrollment Source">
          <select
            id="source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="MANUAL">Manual (office admission)</option>
            <option value="ADMIN_GRANTED">Admin granted</option>
            <option value="FREE">Free enrollment</option>
          </select>
        </FieldShell>
      </div>

      <div className="space-y-2">
        <Input
          name="reason"
          label="Internal Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Offline payment at office, scholarship"
          maxLength={500}
        />
        <p className="text-xs text-slate-500">
          Stored internally in the audit log. No fake Razorpay payment record is created.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || !courseId}>
          {submitting ? "Enrolling…" : "Create Enrollment"}
        </Button>
      </div>
    </form>
  );
}
