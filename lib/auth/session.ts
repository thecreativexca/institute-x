import { cookies } from "next/headers";

import { User, type IUser } from "@/lib/mongodb/models";
import { env } from "@/lib/config/env";
import { connectDB } from "@/lib/db/connect";

export const SESSION_COOKIE_NAME = "sid";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  sessionVersion: number;
}

export interface CreateSessionOptions {
  persistent?: boolean;
}

function isSessionUser(value: unknown): value is SessionUser {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SessionUser>;
  return (
    typeof session.id === "string" &&
    typeof session.name === "string" &&
    typeof session.email === "string" &&
    typeof session.role === "string" &&
    typeof session.status === "string" &&
    typeof session.sessionVersion === "number"
  );
}

export async function createSession(
  user: IUser,
  options: CreateSessionOptions = {}
): Promise<void> {
  const cookieStore = await cookies();

  const sessionData: SessionUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    sessionVersion: user.sessionVersion ?? 0,
  };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    ...(options.persistent ? { maxAge: SESSION_MAX_AGE } : {}),
    path: "/",
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!cookie?.value) {
    return null;
  }

  try {
    const sessionData: unknown = JSON.parse(cookie.value);
    return isSessionUser(sessionData) ? sessionData : null;
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function refreshSession(user: IUser): Promise<void> {
  await createSession(user);
}

export async function validateSession(): Promise<{
  user: SessionUser | null;
  error?: string;
}> {
  const session = await getSession();

  if (!session) {
    return { user: null, error: "No active session" };
  }

  if (session.status !== "active") {
    return { user: null, error: "Account is not active" };
  }

  await connectDB();
  const dbUser = await User.findById(session.id).select(
    "name email role status emailVerifiedAt sessionVersion"
  );

  if (!dbUser) {
    return { user: null, error: "User not found" };
  }

  if (dbUser.status !== "active") {
    return { user: null, error: "Account is not active" };
  }

  if ((dbUser.sessionVersion ?? 0) !== session.sessionVersion) {
    return { user: null, error: "Session has expired" };
  }

  return {
    user: {
      id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role,
      status: dbUser.status,
      emailVerifiedAt: dbUser.emailVerifiedAt?.toISOString() ?? null,
      sessionVersion: dbUser.sessionVersion ?? 0,
    },
  };
}
