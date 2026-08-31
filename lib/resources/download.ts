import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { RESOURCE_ERROR, ResourceError } from "./errors";
import { toResourceErrorResponse } from "./http";
import { extensionForMime, sanitizePublicIdBase } from "./validation";
import { getStudentResourceIfAllowed, type StudentResourceContext } from "./access";

type RouteContext = { params: Promise<{ resourceId: string }> };

/**
 * Shared guard for student resource API routes: session auth (STUDENT +
 * ACTIVE) plus the full resource access chain. Short-circuits with a
 * friendly response on any failure; never leaks internal details.
 */
export async function requireStudentResourceOrResponse(
  ctx: RouteContext
): Promise<{ context: StudentResourceContext } | { response: NextResponse }> {
  const { user } = await getValidatedStudent();
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  const parsedParams = await ctx.params;
  const resourceId = parsedParams.resourceId;

  try {
    const context = await getStudentResourceIfAllowed({
      studentId: user.id,
      resourceId,
    });
    return { context };
  } catch (error) {
    if (error instanceof ResourceError && error.code === RESOURCE_ERROR.NOT_FOUND) {
      // Invalid ids and missing resources look identical to the client.
      return {
        response: NextResponse.json(
          { success: false, error: "Resource not found." },
          { status: 404 }
        ),
      };
    }
    return { response: toResourceErrorResponse(error) };
  }
}

/**
 * Builds a safe download filename pair (ASCII fallback + RFC 5987 UTF-8)
 * derived from the sanitized resource title and canonical extension.
 */
export function studentDownloadFileName(resource: {
  title: string;
  mimeType: string;
}): { ascii: string; encoded: string } {
  const extension = extensionForMime(resource.mimeType) ?? "bin";
  const base = sanitizePublicIdBase(resource.title) || "resource";
  const ascii = `${base}.${extension}`;
  return { ascii, encoded: encodeURIComponent(ascii) };
}
