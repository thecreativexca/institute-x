import Link from "next/link";
import { Award, BookOpenCheck, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Logo } from "@/components/layout/logo";

export function StudentAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="public-theme auth-theme relative flex min-h-screen items-center overflow-hidden px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-55" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-primary-100 bg-white shadow-2xl shadow-primary-950/10 lg:min-h-[42rem] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden overflow-hidden bg-[#10291e] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div aria-hidden="true" className="public-soft-grid absolute inset-0 opacity-20" />
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-300/18 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="relative">
            <Logo variant="auth" />
            <span className="mt-12 inline-flex items-center gap-2 rounded-full border border-accent-200/25 bg-accent-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Student learning portal
            </span>
            <h1 className="mt-5 max-w-md text-3xl font-bold leading-tight tracking-tight xl:text-4xl">Learn practical skills. Build a stronger future.</h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-primary-100">One secure account gives you access to enrolled courses, lesson progress, assessments and verified certificates.</p>
          </div>

          <div className="relative space-y-3">
            {[
              { icon: BookOpenCheck, text: "Continue every course from where you stopped" },
              { icon: Award, text: "Track achievements and access certificates" },
              { icon: ShieldCheck, text: "Protected student account and secure access" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-300 text-primary-950"><item.icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
                <p className="text-sm font-medium text-primary-50">{item.text}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-col bg-[#fffef8] p-5 sm:p-8 lg:p-10 xl:p-12">
          <div className="mb-7 flex items-center justify-between gap-4 lg:hidden">
            <Logo variant="auth" />
            <Link href="/" className="text-xs font-semibold text-primary-700 hover:text-primary-900">Back to website</Link>
          </div>
          <div className="hidden justify-end lg:flex">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary-800">
              <CheckCircle2 className="h-4 w-4 text-primary-500" aria-hidden="true" /> Secure institute portal
            </Link>
          </div>
          <div className="my-auto mx-auto w-full max-w-xl py-2 lg:py-6">{children}</div>
          <p className="mt-7 text-center text-xs text-slate-400">By continuing, you agree to the institute&rsquo;s terms and privacy policy.</p>
        </section>
      </div>
    </main>
  );
}
