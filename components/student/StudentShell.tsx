"use client";

const subscribeNoop = () => () => {};

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  CalendarClock,
  BarChart3,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Megaphone,
  Sparkles,
  User,
  BriefcaseBusiness,
  FolderKanban,
  X,
} from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { NotificationMenu } from "@/components/notifications/notification-menu";
import { cn } from "@/lib/utils/cn";

interface StudentShellProps {
  children: React.ReactNode;
  session: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
}

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/courses", label: "My Courses", icon: BookOpen },
  { href: "/student/sessions", label: "Sessions", icon: CalendarClock },
  { href: "/student/announcements", label: "Announcements", icon: Megaphone },
  { href: "/student/progress", label: "Progress", icon: BarChart3 },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardCheck },
  { href: "/student/internships", label: "Internships", icon: BriefcaseBusiness },
  { href: "/student/projects", label: "Projects", icon: FolderKanban },
  { href: "/student/quizzes", label: "Quizzes", icon: CircleHelp },
  { href: "/student/certificates", label: "Certificates", icon: Award },
  { href: "/student/payments", label: "Payments", icon: CreditCard },
  { href: "/student/support", label: "Support", icon: LifeBuoy },
  { href: "/student/profile", label: "Profile", icon: User },
] as const;

export function StudentShell({ children, session }: StudentShellProps) {
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
    pathname === href || pathname.startsWith(`${href}/`);
  const activeNavItem = navItems.find((item) => isActive(item.href));
  const initials =
    session.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "ST";

  const avatar = (sizeClass: string, radiusClass = "rounded-xl") =>
    session.avatarUrl ? (
      <img
        src={session.avatarUrl}
        alt=""
        className={cn(sizeClass, radiusClass, "shrink-0 bg-primary-100 object-cover")}
        aria-hidden="true"
      />
    ) : (
      <span
        className={cn(
          sizeClass,
          radiusClass,
          "flex shrink-0 items-center justify-center bg-accent-300 text-[11px] font-bold text-primary-950"
        )}
        aria-hidden="true"
      >
        {initials}
      </span>
    );

  return (
    <div className="student-theme min-h-screen bg-surface-muted">
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-primary-200 bg-primary-50 text-primary-950 shadow-2xl shadow-primary-950/10 transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Student sidebar navigation"
      >
        <div aria-hidden="true" className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent-300/15 blur-3xl" />
        <div aria-hidden="true" className="student-grid-pattern absolute inset-0 opacity-35" />

        <div className="relative flex h-[4.5rem] items-center justify-between border-b border-primary-200 px-5">
          <div className="min-w-0" onClick={() => setSidebarOpen(false)}>
            <Logo href="/student/dashboard" variant="compact" />
            <p className="mt-2 truncate text-xs text-primary-700">Student learning portal</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-700 hover:bg-primary-100 hover:text-primary-950 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="relative flex min-h-0 flex-1 flex-col px-4 py-5">
          <p className="shrink-0 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-600">Learning</p>
          <ul className="office-nav-scroll mt-3 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1" role="list">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-primary-100 text-primary-950 shadow-sm"
                        : "text-primary-700 hover:bg-primary-100 hover:text-primary-950"
                    )}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-primary-600 text-white"
                          : "bg-white/80 text-primary-700 group-hover:text-primary-950"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {active ? <span className="h-1.5 w-1.5 rounded-full bg-primary-700" aria-hidden="true" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 pt-6">
            <div className="rounded-2xl border border-primary-200 bg-white/80 p-3.5">
              <div className="flex items-center gap-3">
                {avatar("h-10 w-10")}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-primary-950">{session.name}</p>
                  <p className="truncate text-xs text-primary-700">Active learner</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-100 px-3 py-2 text-xs text-primary-700">
                <Sparkles className="h-3.5 w-3.5 text-accent-700" aria-hidden="true" />
                Keep your learning streak going
              </div>
              <form action="/api/auth/logout" method="POST" className="mt-3 border-t border-primary-200 pt-3">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 hover:text-primary-950"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out securely
                </button>
              </form>
            </div>
          </div>
        </nav>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-primary-100 bg-[#ffffff]/92 backdrop-blur-xl supports-[backdrop-filter]:bg-[#ffffff]/82">
          <Container>
            <div className="flex h-[4.5rem] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-xl p-0 lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                >
                  <Menu className="h-5 w-5" aria-hidden="true" />
                </Button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                    {activeNavItem?.label ?? "Student Portal"}
                  </p>
                  <p className="hidden truncate text-xs text-slate-500 sm:block">Your focused learning workspace</p>
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
                    {avatar("h-8 w-8", "rounded-lg")}
                    <span className="hidden max-w-32 truncate text-sm font-medium text-slate-700 sm:block">{session.name}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </button>
                  {mounted && profileOpen ? (
                    <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl shadow-primary-950/10">
                      <div className="border-b border-primary-100 px-4 py-4">
                        <p className="truncate font-semibold text-slate-900">{session.name}</p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{session.email}</p>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">
                          <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> Student account
                        </span>
                      </div>
                      <Link
                        href="/student/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                        onClick={() => setProfileOpen(false)}
                      >
                        <User className="h-4 w-4" aria-hidden="true" /> View profile
                      </Link>
                      <Link
                        href="/student/dashboard"
                        className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                        onClick={() => setProfileOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" aria-hidden="true" /> Dashboard
                      </Link>
                      <form action="/api/auth/logout" method="POST" className="border-t border-slate-100">
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
