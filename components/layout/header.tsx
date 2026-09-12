"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import { User, LogOut, BookOpen } from "lucide-react";

interface HeaderProps {
  session?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Header({ session }: HeaderProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isStudentLoggedIn = session?.role === "student" && session !== null;

  return (
    <header className="sticky top-0 z-40 border-b border-primary-200/80 bg-[#ffffff]/95 shadow-[0_2px_16px_rgb(161_98_7/0.07)] backdrop-blur-xl supports-[backdrop-filter]:bg-[#ffffff]/85">
      <Container>
        <div className="flex h-[4.5rem] items-center justify-between gap-4">
          <Logo />

          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary-100 text-primary-900"
                        : "text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isStudentLoggedIn ? (
              <>
                <Link
                  href="/student/dashboard"
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                  )}
                >
                  Student Portal
                </Link>
                <Link
                  href="/student/profile"
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    "text-slate-600 hover:bg-primary-50 hover:text-primary-900"
                  )}
                >
                  Profile
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className={buttonVariants("ghost", "sm")}>
                    <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={buttonVariants("ghost", "sm")}>
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center justify-center rounded-full bg-accent-300 px-4 text-sm font-semibold text-primary-950 shadow-sm transition-colors hover:bg-accent-400"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary-900 hover:bg-primary-100 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="sr-only">
              {isMenuOpen ? "Close main menu" : "Open main menu"}
            </span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              {isMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {isMenuOpen ? (
        <div id="mobile-menu" className="border-t border-primary-100 bg-[#ffffff] shadow-lg md:hidden">
          <Container className="py-3">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col">
                {siteConfig.navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={closeMenu}
                      className={cn(
                        "block rounded-xl px-3 py-2.5 text-base font-medium",
                        isActive(item.href)
                          ? "bg-primary-100 text-primary-900"
                          : "text-slate-700 hover:bg-primary-50"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
              {isStudentLoggedIn ? (
                <>
                  <Link
                    href="/student/dashboard"
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium",
                      "text-slate-700 hover:bg-primary-50"
                    )}
                  >
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                    Student Portal
                  </Link>
                  <Link
                    href="/student/profile"
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium",
                      "text-slate-700 hover:bg-primary-50"
                    )}
                  >
                    <User className="h-5 w-5" aria-hidden="true" />
                    Profile
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2.5 text-base font-medium w-full text-left",
                        "text-slate-700 hover:bg-primary-50"
                      )}
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" />
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu} className={buttonVariants("outline", "md")}>
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-accent-300 px-4 text-sm font-semibold text-primary-950 transition-colors hover:bg-accent-400"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
