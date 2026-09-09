import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { getSession, validateSession } from "./session";
import { isAdmin, isStudent } from "./permissions";

export async function getAuthUser(): Promise<{
  user: Awaited<ReturnType<typeof getSession>>;
  isAuthenticated: boolean;
}> {
  const session = await getSession();
  return {
    user: session,
    isAuthenticated: !!session,
  };
}

export async function getValidatedStudent(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
  error?: string;
}> {
  const result = await validateSession();

  if (!result.user) {
    return { user: null, error: result.error };
  }

  if (!isStudent(result.user.role)) {
    return { user: null, error: "Student access required" };
  }

  return { user: result.user, error: undefined };
}

/**
 * Any authenticated user with an ACTIVE account, role read from the server
 * session. Callers enforce role-specific permissions themselves.
 */
export async function getValidatedSession(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
  error?: string;
}> {
  const result = await validateSession();

  if (!result.user) {
    return { user: null, error: result.error };
  }

  return { user: result.user, error: undefined };
}

/**
 * Require an authenticated admin user with active status.
 * Redirects to login if not authenticated or not an admin.
 */
export async function requireAdmin(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
}> {
  const result = await validateSession();

  if (!result.user) {
    redirect("/office/login?reauth=1");
  }

  if (!isAdmin(result.user.role) || result.user.status !== "active") {
    redirect("/office/login?reauth=1");
  }

  return { user: result.user };
}

/**
 * Require an authenticated student user with active status.
 * Redirects to login if not authenticated or not a student.
 */
export async function requireStudent(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
}> {
  const result = await validateSession();

  if (!result.user) {
    redirect("/login?reauth=1");
  }

  if (!isStudent(result.user.role) || result.user.status !== "active") {
    redirect("/login?reauth=1");
  }

  return { user: result.user };
}

/**
 * Require an authenticated admin user for API routes.
 * Returns NextResponse with error if not authenticated or not an admin.
 */
export async function requireAdminApi(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
  errorResponse?: NextResponse;
}> {
  const result = await validateSession();

  if (!result.user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isAdmin(result.user.role) || result.user.status !== "active") {
    return {
      user: null,
      errorResponse: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: result.user };
}

/**
 * Require an authenticated student user for API routes.
 * Returns NextResponse with error if not authenticated or not a student.
 */
export async function requireStudentApi(): Promise<{
  user: Awaited<ReturnType<typeof validateSession>>["user"];
  errorResponse?: NextResponse;
}> {
  const result = await validateSession();

  if (!result.user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isStudent(result.user.role) || result.user.status !== "active") {
    return {
      user: null,
      errorResponse: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: result.user };
}

export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getSession();
  if (session) {
    redirect("/student/dashboard");
  }
}

export async function redirectIfNotStudent(): Promise<void> {
  const result = await validateSession();
  if (!result.user || !isStudent(result.user.role)) {
    redirect("/login?reauth=1");
  }
}
