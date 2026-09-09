import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/verify-certificate",
  "/courses",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/refund-policy",
  "/api/health",
];

const AUTH_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
];
const OFFICE_AUTH_PATHS = [
  "/office/login",
  "/office/forgot-password",
  "/office/reset-password",
];

function matchesPath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + "/");
}

function matchesAny(pathname: string, paths: readonly string[]): boolean {
  return paths.some((path) => matchesPath(pathname, path));
}

/** Two-role system: the office portal belongs to ADMIN only. */
function isOfficeRole(role: string): boolean {
  return role === "admin";
}

function readOptimisticSession(request: NextRequest): {
  role: string;
  status: string;
} | null {
  const value = request.cookies.get("sid")?.value;
  if (!value) return null;

  try {
    const session: unknown = JSON.parse(value);
    if (!session || typeof session !== "object") return null;
    const candidate = session as { role?: unknown; status?: unknown };
    if (typeof candidate.role !== "string" || typeof candidate.status !== "string") {
      return null;
    }
    return { role: candidate.role, status: candidate.status };
  } catch {
    return null;
  }
}

function clearSessionAndRedirect(request: NextRequest, destination: string) {
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.delete("sid");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestedPath = `${pathname}${search}`;
  const session = readOptimisticSession(request);

  // Forward the requested path to the page so server layouts that guard whole
  // segments (e.g. /office/*) can skip public auth routes nested inside them.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // A Server Component can discover that an otherwise well-formed cookie is
  // stale (for example after a password change), but Next.js only permits
  // cookie mutation in a proxy, Server Action, or Route Handler. The protected
  // page redirects here with this one-shot flag so the proxy can clear the
  // invalid cookie without creating an auth redirect loop.
  if (
    request.nextUrl.searchParams.get("reauth") === "1" &&
    (pathname === "/login" || pathname === "/office/login")
  ) {
    return clearSessionAndRedirect(request, pathname);
  }

  if (matchesAny(pathname, OFFICE_AUTH_PATHS)) {
    if (session && isOfficeRole(session.role) && session.status === "active") {
      return NextResponse.redirect(new URL("/office", request.url));
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (matchesPath(pathname, "/student")) {
    if (!session) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", requestedPath);
      return NextResponse.redirect(loginUrl);
    }
    if (session.status !== "active") {
      return clearSessionAndRedirect(request, "/login");
    }
    if (isOfficeRole(session.role)) {
      return NextResponse.redirect(new URL("/office", request.url));
    }
    if (session.role !== "student") {
      return clearSessionAndRedirect(request, "/login");
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (matchesPath(pathname, "/office")) {
    if (!session) {
      const loginUrl = new URL("/office/login", request.url);
      loginUrl.searchParams.set("callbackUrl", requestedPath);
      return NextResponse.redirect(loginUrl);
    }
    if (session.status !== "active") {
      return clearSessionAndRedirect(request, "/office/login");
    }
    if (session.role === "student") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    if (!isOfficeRole(session.role)) {
      return clearSessionAndRedirect(request, "/office/login");
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (matchesAny(pathname, AUTH_PATHS) && session) {
    if (session.role === "student" && session.status === "active") {
      return NextResponse.redirect(new URL("/student/dashboard", request.url));
    }
    if (isOfficeRole(session.role) && session.status === "active") {
      return NextResponse.redirect(new URL("/office", request.url));
    }
  }

  if (matchesAny(pathname, PUBLIC_PATHS)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|assets/).*)",
  ],
};
