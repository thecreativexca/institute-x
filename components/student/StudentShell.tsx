"use client";

const subscribeNoop = () => () => {};

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  Bell,
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
  Sparkles,
  User,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
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
  { href: "/student/progress", label: "Progress", icon: BarChart3 },
  { href: "/student/assignments", label: "Assignments", icon: ClipboardCheck },
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-white/10 bg-[#10291e] text-white shadow-2xl shadow-primary-950/25 transition-transform duration-200 ease-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Student sidebar navigation"
      >
        <div aria-hidden="true" className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent-300/15 blur-3xl" />
        <div aria-hidden="true" className="student-grid-pattern absolute inset-0 opacity-35" />

        <div className="relative flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/student/dashboard"
            className="flex min-w-0 items-center gap-3"
            onClick={() => setSidebarOpen(false)}
            aria-label={`${siteConfig.name} Student Portal`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-200 to-accent-400 text-sm font-bold text-primary-950 shadow-lg shadow-primary-950/25">
              {siteConfig.shortName}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-wide text-white">Student Portal</span>
              <span className="block truncate text-xs text-primary-200">My learning space</span>
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-primary-100 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="relative flex min-h-0 flex-1 flex-col px-4 py-5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-300">Learning</p>
          <ul className="mt-3 flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-accent-200 text-primary-950 shadow-lg shadow-primary-950/20"
                        : "text-primary-100 hover:bg-white/[0.08] hover:text-white"
                    )}
                    onClick={() => setSidebarOpen(false)}
                    aria-current={active ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        active
                          ? "bg-primary-800 text-accent-200"
                          : "bg-white/[0.06] text-primary-200 group-hover:text-white"
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

          <div className="mt-auto pt-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5">
              <div className="flex items-center gap-3">
                {avatar("h-10 w-10")}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{session.name}</p>
                  <p className="truncate text-xs text-primary-200">Active learner</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary-950/35 px-3 py-2 text-xs text-primary-100">
                <Sparkles className="h-3.5 w-3.5 text-accent-300" aria-hidden="true" />
                Keep your learning streak going
              </div>
              <form action="/api/auth/logout" method="POST" className="mt-3 border-t border-white/10 pt-3">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-primary-100 transition-colors hover:bg-white/[0.07] hover:text-white"
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
        <header className="sticky top-0 z-30 border-b border-primary-100 bg-[#fffef8]/92 backdrop-blur-xl supports-[backdrop-filter]:bg-[#fffef8]/82">
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
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-10 w-10 rounded-xl p-0"
                    onClick={() => {
                      setNotificationsOpen((open) => !open);
                      setProfileOpen(false);
                    }}
                    aria-label="Notifications"
                    aria-expanded={notificationsOpen}
                    aria-haspopup="true"
                  >
                    <Bell className="h-5 w-5 text-slate-600" aria-hidden="true" />
                  </Button>
                  {mounted && notificationsOpen ? (
                    <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl shadow-primary-950/10">
                      <div className="flex items-center justify-between border-b border-primary-100 px-4 py-3.5">
                        <h3 className="font-semibold text-slate-900">Notifications</h3>
                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">All clear</span>
                      </div>
                      <div className="px-5 py-8 text-center">
                        <Bell className="mx-auto h-8 w-8 text-primary-200" aria-hidden="true" />
                        <p className="mt-3 text-sm font-medium text-slate-700">You&rsquo;re all caught up</p>
                        <p className="mt-1 text-xs text-slate-500">Course updates will appear here.</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-xl border border-primary-100 bg-white p-1.5 pr-2.5 text-left shadow-sm transition-colors hover:border-primary-200 hover:bg-primary-50/60"
                    onClick={() => {
                      setProfileOpen((open) => !open);
                      setNotificationsOpen(false);
                    }}
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
