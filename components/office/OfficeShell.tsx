"use client";

const subscribeNoop = () => () => {};

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  ContactRound,
  FileStack,
  FolderTree,
  HelpCircle,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Menu,
  ShieldCheck,
  Settings,
  TicketPercent,
  SlidersHorizontal,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NotificationMenu } from "@/components/notifications/notification-menu";
import { hasPermission } from "@/lib/auth/permissions";
import { PERMISSIONS, ROLE_LABELS, type Permission } from "@/lib/constants";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";

interface OfficeShellProps {
  children: React.ReactNode;
  session: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    avatarUrl?: string;
    designation?: string;
    department?: string;
  };
}

const navItems = [
  { href: "/office", label: "Dashboard", icon: LayoutDashboard, permissions: [PERMISSIONS.ADMIN_ACCESS] },
  { href: "/office/students", label: "Students", icon: Users, permissions: [PERMISSIONS.STUDENTS_READ] },
  { href: "/office/categories", label: "Categories", icon: FolderTree, permissions: [PERMISSIONS.COURSES_READ] },
  { href: "/office/courses", label: "Courses", icon: BookOpen, permissions: [PERMISSIONS.COURSES_READ] },
  { href: "/office/enrollments", label: "Enrollments", icon: ContactRound, permissions: [PERMISSIONS.ENROLLMENTS_MANAGE] },
  { href: "/office/payments", label: "Payments & Orders", icon: Wallet, permissions: [PERMISSIONS.PAYMENTS_READ] },
  { href: "/office/coupons", label: "Coupons", icon: TicketPercent, permissions: [PERMISSIONS.PAYMENTS_MANAGE] },
  { href: "/office/sessions", label: "Sessions", icon: CalendarClock, permissions: [PERMISSIONS.SESSIONS_READ] },
  { href: "/office/analytics", label: "Analytics", icon: TrendingUp, permissions: [PERMISSIONS.ANALYTICS_READ] },
  { href: "/office/certificates", label: "Certificates", icon: Award, permissions: [PERMISSIONS.CERTIFICATES_READ] },
  { href: "/office/resources", label: "Resources", icon: FileStack, permissions: [PERMISSIONS.RESOURCES_MANAGE] },
  {
    href: "/office/assignments",
    label: "Assignments",
    icon: ClipboardList,
    permissions: [PERMISSIONS.ASSIGNMENTS_READ, PERMISSIONS.ASSIGNMENTS_MANAGE, PERMISSIONS.ASSIGNMENTS_GRADE],
  },
  {
    href: "/office/quizzes",
    label: "Quizzes",
    icon: HelpCircle,
    permissions: [PERMISSIONS.QUIZZES_READ, PERMISSIONS.QUIZZES_MANAGE, PERMISSIONS.QUIZ_RESULTS_READ],
  },
  { href: "/office/announcements", label: "Announcements", icon: Megaphone, permissions: [PERMISSIONS.ANNOUNCEMENTS_MANAGE] },
  { href: "/office/support", label: "Support", icon: LifeBuoy, permissions: [PERMISSIONS.SUPPORT_READ] },
  { href: "/office/settings", label: "Settings", icon: SlidersHorizontal, permissions: [PERMISSIONS.ADMIN_ACCESS] },
  { href: "/office/account", label: "My Account", icon: Settings, permissions: [PERMISSIONS.ADMIN_ACCESS] },
] satisfies Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permissions: readonly Permission[];
}>;

export function OfficeShell({ children, session }: OfficeShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const isActive = (href: string) =>
    href === "/office"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const visibleNavItems = navItems.filter((item) =>
    item.permissions.some((permission) => hasPermission(session.role, permission))
  );
  const activeNavItem = visibleNavItems.find((item) => isActive(item.href));
  const roleLabel = ROLE_LABELS[session.role as keyof typeof ROLE_LABELS] || session.role;
  const initials = session.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "OP";

  return (
    <div className="office-theme min-h-screen bg-surface-muted">
      {mounted && sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-white/10 bg-[#10291e] text-white shadow-2xl shadow-primary-950/25 transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Office sidebar navigation"
      >
        <div aria-hidden="true" className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent-300/15 blur-3xl" />
        <div className="relative flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
          <Link href="/office" className="flex min-w-0 items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-200 to-accent-400 text-sm font-bold text-primary-950 shadow-lg shadow-primary-950/25">
              {siteConfig.shortName}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide text-white">Office Portal</span>
              <span className="block truncate text-xs text-primary-200">Institute operations</span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="relative flex min-h-0 flex-1 flex-col px-4 py-5">
          <p className="shrink-0 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300">Workspace</p>
          <ul className="office-nav-scroll mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1" role="list">
            {visibleNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "bg-accent-200 text-primary-950 shadow-lg shadow-primary-950/20"
                      : "text-primary-100 hover:bg-white/[0.08] hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                      isActive(item.href)
                        ? "bg-primary-800 text-accent-200"
                        : "bg-white/[0.06] text-primary-200 group-hover:text-white"
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive(item.href) ? <span className="h-1.5 w-1.5 rounded-full bg-primary-700" aria-hidden="true" /> : null}
                </Link>
              </li>
            ))}
          </ul>

          <div className="shrink-0 pt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-300 text-xs font-bold text-primary-950">
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{session.name}</p>
                  <p className="truncate text-xs text-primary-200">{roleLabel}</p>
                </div>
              </div>
              <form action="/api/auth/office-logout" method="POST" className="mt-3 border-t border-white/10 pt-3">
                <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-primary-100 transition-colors hover:bg-white/[0.07] hover:text-white">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out securely
                </button>
              </form>
            </div>
          </div>
        </nav>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary-100 bg-[#fffef8]/92 backdrop-blur-xl supports-[backdrop-filter]:bg-[#fffef8]/82">
          <Container>
            <div className="flex h-[4.5rem] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl p-0 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" aria-expanded={sidebarOpen}>
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">{activeNavItem?.label ?? "Office Portal"}</p>
                  <p className="hidden truncate text-xs text-slate-500 sm:block">Secure institute management workspace</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <NotificationMenu />

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-primary-100 bg-white p-1.5 pr-2.5 text-left shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/60"
                    onClick={() => setProfileOpen((open) => !open)}
                    aria-label="Profile menu"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-bold text-primary-700">{initials}</span>
                    <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">{session.name}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </button>
                  {mounted && profileOpen ? (
                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl shadow-primary-950/10">
                      <div className="border-b border-primary-100 px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">{session.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{session.email}</p>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> {roleLabel}
                        </span>
                      </div>
                      <Link href="/office" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-900" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                      </Link>
                      <form action="/api/auth/office-logout" method="POST" className="border-t border-slate-100">
                        <button type="submit" className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50">
                          <LogOut className="h-4 w-4" aria-hidden="true" /> Logout
                        </button>
                      </form>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Container>
        </header>

        <main id="main-content">
          <Container className="py-6 sm:py-8 lg:py-10">{children}</Container>
        </main>
      </div>
    </div>
  );
}
