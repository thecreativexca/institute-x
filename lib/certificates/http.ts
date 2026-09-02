import { NextResponse } from "next/server";

import { USER_ROLES } from "@/lib/constants";

/**
 * Rate-limit foundation for the public certificate verification lookup
 * (spec §29/#49, §80).
 *
 * Simple in-memory token bucket keyed by client IP. In single-instance
 * deployments this is a real safeguard; in multi-instance setups each instance
 * polices its own slice (acceptable as a Phase 12 foundation — a shared store
 * is a later concern). Kept deliberately small and dependency-free.
 */
const MAX_REQUESTS = 20; // per window per IP
const WINDOW_MS = 60 * 1000;

const buckets = new Map<string, { count: number; windowStart: number }>();

export function isVerificationRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return true;
  }
  return false;
}

export interface Actor {
  id: string;
  role: string;
}

/** True when the actor is permitted to issue/revoke as an admin (office/staff). */
export function isAuthorizedStaffRole(role: string): boolean {
  return role === USER_ROLES.ADMIN;
}

/** Helper for simple JSON responses. */
export function okJson(data: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}