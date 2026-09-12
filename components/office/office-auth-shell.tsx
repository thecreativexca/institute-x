import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { Building2, ClipboardCheck, LockKeyhole, ShieldCheck } from "lucide-react";

export function OfficeAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="office-theme relative flex min-h-screen items-center overflow-hidden bg-[#f8fbfd] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div aria-hidden="true" className="office-grid-pattern absolute inset-0 opacity-45" />
      <div aria-hidden="true" className="absolute -left-28 -top-28 h-96 w-96 rounded-full bg-primary-200/55 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent-200/55 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-primary-100 bg-white shadow-2xl shadow-primary-950/10 lg:min-h-[42rem] lg:grid-cols-[0.88fr_1.12fr]">
        <aside className="relative hidden overflow-hidden bg-primary-50 p-10 text-primary-950 lg:flex lg:flex-col lg:justify-between xl:p-12">
          <div aria-hidden="true" className="office-grid-pattern absolute inset-0 opacity-20" />
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-300/18 blur-3xl" />
          <div className="relative">
            <Logo variant="auth" />
            <span className="mt-12 inline-flex items-center gap-2 rounded-full border border-accent-200 bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-800">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Authorized admin only
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight xl:text-4xl">Secure institute operations in one workspace.</h1>
            <p className="mt-4 text-sm leading-7 text-primary-700">Manage learners, academic work and support requests with role-based access designed for your institute team.</p>
          </div>
          <div className="relative space-y-3">
            {[
              { icon: Building2, text: "One workspace for daily institute operations" },
              { icon: ClipboardCheck, text: "Role-aware academic and support tools" },
              { icon: LockKeyhole, text: "Protected staff accounts and secure sessions" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-primary-200 bg-white/80 px-4 py-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-300 text-primary-950"><item.icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
                <p className="text-sm font-medium text-primary-800">{item.text}</p>
              </div>
            ))}
          </div>
        </aside>
        <section className="flex min-w-0 flex-col bg-[#ffffff] p-5 sm:p-8 lg:p-10 xl:p-12">
          <div className="mb-7 flex items-center justify-between gap-4 lg:hidden">
            <Logo variant="auth" />
            <Link href="/" className="text-xs font-semibold text-primary-700 hover:text-primary-900">Public website</Link>
          </div>
          <div className="hidden justify-end lg:flex">
            <Link href="/" className="text-sm font-medium text-slate-500 hover:text-primary-800">Return to website</Link>
          </div>
          <div className="my-auto mx-auto w-full max-w-xl py-2 lg:py-6">{children}</div>
          <p className="mt-7 text-center text-xs text-slate-400">Office Portal access is monitored and restricted by staff role.</p>
        </section>
      </div>
    </main>
  );
}
