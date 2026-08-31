import { redirect } from "next/navigation";

import { getSession, validateSession } from "./session";
import { isStudent } from "./permissions";

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
 * session. Callers enforce role-specific permissions themselves (e.g. the
 * resource manager guard).
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

export async function redirectIfAuthenticated(): Promise<void> {
  const session = await getSession();
  if (session) {
    redirect("/student/dashboard");
  }
}

export async function redirectIfNotStudent(): Promise<void> {
  const result = await validateSession();
  if (!result.user || !isStudent(result.user.role)) {
    redirect("/login");
  }
}