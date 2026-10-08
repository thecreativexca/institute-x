"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/layout/logo";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/config/site";
import { cn } from "@/lib/utils/cn";
import { ArrowUpRight, BookOpen, LogOut, User } from "lucide-react";

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
    <header className="public-header">
      <Container>
        <div className="public-header-inner">
          <Logo className="relative z-10" />

          <nav aria-label="Main navigation" className="public-nav">
            <ul className="public-nav-list">
              {siteConfig.navigation.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="public-nav-link"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="public-header-actions">
            {isStudentLoggedIn ? (
              <>
                <Link
                  href="/student/dashboard"
                  className="public-login"
                >
                  Student Portal
                </Link>
                <Link
                  href="/student/profile"
                  className="public-login"
                >
                  Profile
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="public-login inline-flex items-center">
                    <LogOut className="h-4 w-4 mr-1" aria-hidden="true" />
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="public-login">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="public-button-dark public-register"
                >
                  Register <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="public-mobile-toggle"
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
        <div id="mobile-menu" className="public-mobile-menu lg:hidden">
          <Container className="py-5">
            <nav aria-label="Mobile navigation">
              <ul className="flex flex-col divide-y divide-primary-200">
                {siteConfig.navigation.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={closeMenu}
                      className={cn(
                        "flex items-center justify-between py-3 text-lg font-semibold",
                        isActive(item.href) ? "text-accent-600" : "text-primary-950"
                      )}
                    >
                      {item.label}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-5 flex flex-col gap-2 border-t border-primary-200 pt-5">
              {isStudentLoggedIn ? (
                <>
                  <Link
                    href="/student/dashboard"
                    onClick={closeMenu}
                    className="flex items-center gap-2 py-2.5 text-base font-medium"
                  >
                    <BookOpen className="h-5 w-5" aria-hidden="true" />
                    Student Portal
                  </Link>
                  <Link
                    href="/student/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-2 py-2.5 text-base font-medium"
                  >
                    <User className="h-5 w-5" aria-hidden="true" />
                    Profile
                  </Link>
                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      onClick={closeMenu}
                      className="flex w-full items-center gap-2 py-2.5 text-left text-base font-medium"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" />
                      Logout
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeMenu} className="public-button-line">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={closeMenu}
                    className="public-button"
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
