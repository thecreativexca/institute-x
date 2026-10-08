"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

interface RequestFormProps {
  type: "contact" | "enrollment";
  courses?: Array<{ name: string; slug: string }>;
  selectedCourse?: { name: string; slug: string };
  className?: string;
}

const fieldClassName = "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/40 focus:border-amber-300 focus:bg-white/15 focus:ring-2 focus:ring-amber-300/15";

export function RequestForm({ type, courses = [], selectedCourse, className }: RequestFormProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [courseSlug, setCourseSlug] = useState(selectedCourse?.slug ?? "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          fullName: data.get("fullName"),
          phone: data.get("phone"),
          email: data.get("email"),
          courseSlug: (selectedCourse?.slug ?? courseSlug) || undefined,
          message: data.get("message"),
          sourcePath: window.location.pathname,
          website: data.get("website"),
        }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string };
      if (!response.ok || !payload.success) throw new Error(payload.error || "Unable to submit your request.");
      setSubmitted(true);
      form.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit your request.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className={cn("contact-form-shell", className)} role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-2xl font-semibold">Request received</h2>
        <p className="mt-2 max-w-xl leading-7">
          Our admissions team will review it and contact you on the phone number you provided.
        </p>
        <button type="button" onClick={() => setSubmitted(false)} className="mt-6 text-sm font-bold text-amber-300 hover:text-amber-200">
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("contact-form-shell", className)}>
      <div className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] !text-amber-300">{type === "enrollment" ? "Admission request" : "Talk to our team"}</p>
        <h2 className="mt-2 text-2xl font-semibold">{type === "enrollment" ? `Enroll in ${selectedCourse?.name ?? "this course"}` : "How can we help?"}</h2>
        <p className="mt-2 text-sm">Submit once—your request will appear directly in the admin portal.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Full name<input name="fullName" required minLength={2} maxLength={100} autoComplete="name" placeholder="Your name" className={`${fieldClassName} mt-1.5`} /></label>
          <label className="text-sm font-semibold">Phone / WhatsApp<input name="phone" required minLength={8} maxLength={24} autoComplete="tel" inputMode="tel" placeholder="Your phone number" className={`${fieldClassName} mt-1.5`} /></label>
        </div>
        <label className="text-sm font-semibold">Email <span className="font-normal text-white/50">(optional)</span><input name="email" type="email" maxLength={160} autoComplete="email" placeholder="you@example.com" className={`${fieldClassName} mt-1.5`} /></label>

        {selectedCourse ? (
          <div className="rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3">
            <span className="text-xs text-white/55">Selected course</span>
            <p className="mt-0.5 font-semibold !text-white">{selectedCourse.name}</p>
          </div>
        ) : courses.length ? (
          <label className="text-sm font-semibold">Course of interest<select value={courseSlug} onChange={(event) => setCourseSlug(event.target.value)} className={`${fieldClassName} mt-1.5`}><option value="">General guidance</option>{courses.map((course) => <option key={course.slug} value={course.slug}>{course.name}</option>)}</select></label>
        ) : null}

        <label className="text-sm font-semibold">Message <span className="font-normal text-white/50">(optional)</span><textarea name="message" rows={4} maxLength={1500} placeholder={type === "enrollment" ? "Tell us the best time to call or ask about fees and batches." : "Tell us what you would like to know."} className={`${fieldClassName} mt-1.5 resize-y`} /></label>
        <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        {error ? <p className="rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm !text-red-100" role="alert">{error}</p> : null}
        <button type="submit" disabled={pending} className="mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-70">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          {pending ? "Submitting…" : type === "enrollment" ? "Send enrollment request" : "Send request"}
        </button>
        <p className="text-center text-xs leading-5">Prefer to talk now? Call <a className="font-bold !text-amber-300" href={siteConfig.contact.phoneHref}>{siteConfig.contact.phone}</a>.</p>
      </div>
    </form>
  );
}
