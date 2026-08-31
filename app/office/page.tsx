import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  ClipboardList,
  ContactRound,
  FileStack,
  HelpCircle,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Settings,
  Users,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OfficeShell } from "@/components/office/OfficeShell";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS, ROLE_LABELS, type Permission, type UserRole } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Office Portal",
  description: "Staff management portal of the institute.",
  robots: { index: false },
};

const modules: Array<{
  href: string;
  label: string;
  description: string;
  icon: typeof Users;
  iconClassName: string;
  iconSurfaceClassName: string;
  permissions: readonly Permission[];
}> = [
  { href: "/office/students", label: "Students", description: "Review learner accounts, enrollments and academic progress.", icon: Users, iconClassName: "text-primary-800", iconSurfaceClassName: "bg-primary-100", permissions: [PERMISSIONS.STUDENTS_READ] },
  { href: "/office/faculty", label: "Faculty", description: "View faculty profiles, departments and assigned course responsibilities.", icon: ContactRound, iconClassName: "text-accent-800", iconSurfaceClassName: "bg-accent-100", permissions: [PERMISSIONS.STAFF_READ] },
  { href: "/office/resources", label: "Resources", description: "Organize lesson documents and downloadable study material.", icon: FileStack, iconClassName: "text-accent-800", iconSurfaceClassName: "bg-accent-100", permissions: [PERMISSIONS.RESOURCES_MANAGE] },
  { href: "/office/assignments", label: "Assignments", description: "Create tasks, review submissions and manage grading.", icon: ClipboardList, iconClassName: "text-primary-700", iconSurfaceClassName: "bg-primary-50", permissions: [PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_MANAGE, PERMISSIONS.ASSIGNMENTS_GRADE] },
  { href: "/office/quizzes", label: "Quizzes", description: "Manage assessments, question banks and learner results.", icon: HelpCircle, iconClassName: "text-accent-700", iconSurfaceClassName: "bg-accent-50", permissions: [PERMISSIONS.QUIZZES_READ, PERMISSIONS.QUIZZES_MANAGE, PERMISSIONS.QUIZ_RESULTS_READ] },
  { href: "/office/announcements", label: "Announcements", description: "Publish timely updates for students and staff audiences.", icon: Megaphone, iconClassName: "text-[#5f7425]", iconSurfaceClassName: "bg-[#f1f6cf]", permissions: [PERMISSIONS.ANNOUNCEMENTS_MANAGE] },
  { href: "/office/support", label: "Support", description: "Respond to learner requests and resolve open tickets.", icon: LifeBuoy, iconClassName: "text-emerald-800", iconSurfaceClassName: "bg-emerald-50", permissions: [PERMISSIONS.SUPPORT_READ] },
  { href: "/office/account", label: "My Account", description: "Review your staff profile and keep account security up to date.", icon: Settings, iconClassName: "text-primary-800", iconSurfaceClassName: "bg-primary-100", permissions: [PERMISSIONS.OFFICE_ACCESS] },
];

export default async function OfficeHomePage() {
  const { user } = await getValidatedSession();
  if (!user) redirect("/office/login?callbackUrl=/office");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  const visibleModules = modules.filter((module) =>
    module.permissions.some((permission) => hasPermission(user.role, permission))
  );
  const roleLabel = ROLE_LABELS[user.role as UserRole] ?? "Office Team";

  return (
    <OfficeShell session={user}>
      <div className="space-y-8">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-primary-900 bg-[#10291e] px-6 py-7 text-white shadow-xl shadow-primary-950/15 sm:px-8 sm:py-9">
          <div aria-hidden="true" className="office-grid-pattern absolute inset-0 opacity-20" />
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-accent-300/18 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                {roleLabel}
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {user.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-100 sm:text-base">
                Access the management areas available to your role and keep institute operations moving smoothly.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-accent-300/20 bg-white/[0.07] px-4 py-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-300 text-primary-950">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs text-primary-200">Workspace status</p>
                <p className="text-sm font-semibold text-white">Secure &amp; ready</p>
              </div>
            </div>
          </div>
        </header>

        {visibleModules.length > 0 ? (
          <section aria-labelledby="office-workspaces-heading">
            <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Management tools</p>
                <h2 id="office-workspaces-heading" className="mt-1.5 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Your workspaces</h2>
              </div>
              <p className="text-sm text-slate-500">{visibleModules.length} areas available</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleModules.map((module) => (
                <Link key={module.href} href={module.href} className="group rounded-2xl focus-visible:outline-offset-4">
                  <Card className="h-full overflow-hidden border-slate-200/80 transition-all duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-card-hover">
                    <CardContent className="flex h-full flex-col p-5 sm:p-6">
                      <div className="flex items-start justify-between">
                        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${module.iconSurfaceClassName} ${module.iconClassName}`}>
                          <module.icon className="h-5.5 w-5.5" aria-hidden="true" />
                        </span>
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all group-hover:border-primary-200 group-hover:bg-primary-50 group-hover:text-primary-700">
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </span>
                      </div>
                      <h3 className="mt-5 text-base font-semibold text-slate-900">{module.label}</h3>
                      <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{module.description}</p>
                      <div className="mt-5 h-1 w-12 rounded-full bg-slate-100 transition-colors group-hover:bg-primary-400" aria-hidden="true" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-sm text-slate-600">No management workspace is assigned to this role yet.</p>
              <Link href="/" className={buttonVariants("outline", "md", "mt-4")}>Return to website</Link>
            </CardContent>
          </Card>
        )}
      </div>
    </OfficeShell>
  );
}
