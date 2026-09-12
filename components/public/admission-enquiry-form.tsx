"use client";

import { useState } from "react";
import { CheckCircle2, Send, Sparkles, AlertCircle } from "lucide-react";

const coursesList = [
  "Basic Computer Course",
  "TallyPrime + Corporate Accounting",
  "Web Development (Full-Stack / React)",
  "Graphic Design & Digital Media",
  "Python Programming Fundamentals",
  "Data Entry & Typing Speed Course",
  "Spoken English & Personality Development",
  "Digital Marketing & SEO",
  "Yoga & Wellness Practice",
  "Other / Need Guidance",
];

export function AdmissionEnquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    course: coursesList[0],
    mode: "Classroom Center",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate swift submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-8 text-center sm:p-10 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-emerald-950">Thank You, {formData.fullName}!</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          Your admission enquiry for <strong className="font-semibold">{formData.course}</strong> has been received by our academic desk.
        </p>
        <p className="mt-2 text-xs text-emerald-700">
          Our senior counselor will contact you on <strong className="font-semibold">{formData.phone}</strong> shortly with syllabus details and demo class timings.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setFormData({
              fullName: "",
              phone: "",
              email: "",
              course: coursesList[0],
              mode: "Classroom Center",
              message: "",
            });
          }}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-900 transition-colors"
        >
          Submit Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-primary-200 bg-white p-6 sm:p-8 shadow-[0_12px_36px_rgba(113,63,18,0.08)]"
    >
      <div className="flex items-center gap-2 mb-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-primary-950">Admission & Free Demo Class Enquiry</h2>
          <p className="text-xs text-slate-500">Fill in your details for quick counselor callback</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
            Full Name *
          </label>
          <input
            id="fullName"
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="e.g. Priya Sharma"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 transition-all"
          />
        </div>

        {/* Phone & Email Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="phone" className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
              WhatsApp / Mobile *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. +91 98765 43210"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. student@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 transition-all"
            />
          </div>
        </div>

        {/* Course Selection */}
        <div>
          <label htmlFor="course" className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
            Course of Interest *
          </label>
          <select
            id="course"
            value={formData.course}
            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 transition-all"
          >
            {coursesList.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Preferred Learning Mode */}
        <div>
          <label className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
            Preferred Learning Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["Classroom Center", "Online Live", "Hybrid"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFormData({ ...formData, mode })}
                className={`rounded-xl border py-2.5 px-3 text-xs font-semibold transition-all ${
                  formData.mode === mode
                    ? "border-primary-600 bg-primary-50 text-primary-950 shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Message / Query */}
        <div>
          <label htmlFor="message" className="block text-xs font-bold text-primary-950 uppercase tracking-wider mb-1.5">
            Questions / Specific Requirements (Optional)
          </label>
          <textarea
            id="message"
            rows={3}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="e.g. Inquiring about weekend batch timings and installment fees..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 transition-all"
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-900 py-3.5 px-6 text-sm font-bold text-white shadow-md hover:bg-primary-950 transition-all disabled:opacity-50"
        >
          {loading ? (
            <span>Sending Enquiry...</span>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Submit Admission Enquiry & Book Demo</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500 mt-2">
          🔒 Your details are kept confidential. We will never spam or share your contact.
        </p>
      </div>
    </form>
  );
}
