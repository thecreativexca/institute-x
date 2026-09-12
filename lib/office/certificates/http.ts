import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

import { requireAdminApi } from "@/lib/auth/helpers";
import { toCertificateErrorResponse } from "@/lib/certificates/errors";

/**
 * Shared HTTP plumbing for the admin certificate routes.
 *
 * Authorization is enforced HERE, once, for every route in the module: the role
 * always comes from the validated server session (`requireAdminApi`), never
 * from the request. A non-admin gets 403 and never reaches the service layer.
 */

export interface AdminActor {
  id: string;
  role: string;
  name: string;
}

export type AdminGuardResult =
  | { actor: AdminActor; response: null }
  | { actor: null; response: NextResponse };

export async function requireAdminForCertificates(): Promise<AdminGuardResult> {
  const { user, errorResponse } = await requireAdminApi();
  if (errorResponse || !user) {
    return {
      actor: null,
      response:
        errorResponse ??
        NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }
  return {
    actor: { id: user.id, role: user.role, name: user.name },
    response: null,
  };
}

/** 400 helper for schema failures, surfacing the first field message. */
export function validationError(
  result: { success: false; error: z.ZodError },
  fallback = "Please review the form and try again."
): NextResponse {
  const message = result.error.issues[0]?.message ?? fallback;
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export { toCertificateErrorResponse };

/**
 * Converts URLSearchParams to a plain object for zod parsing, dropping empty
 * values so the schema defaults apply instead of failing on `""`.
 */
export function searchParamsToObject(
  searchParams: URLSearchParams
): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    const trimmed = value.trim();
    if (trimmed !== "") raw[key] = trimmed;
  }
  return raw;
}

/** Reads a form field as a trimmed string, or undefined when absent/empty. */
export function formString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
