import { NextResponse } from "next/server";

import { getValidatedSession } from "@/lib/auth/helpers";
import { RESOURCE_ERROR, ResourceError } from "./errors";
import { assertResourceManager } from "./access";

/**
 * Resolves the authenticated session and enforces the resource-manager role
 * (server session only — never a client-supplied role).
 */
export async function requireResourceManagerOrResponse(): Promise<
  { staff: { id: string } } | { response: NextResponse }
> {
  const result = await getValidatedSession();

  if (!result.user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  try {
    assertResourceManager(result.user.role);
  } catch {
    return {
      response: NextResponse.json(
        { success: false, error: "You do not have permission to manage resources." },
        { status: 403 }
      ),
    };
  }

  return { staff: { id: result.user.id } };
}

function statusForCode(code?: string): number {
  switch (code) {
    case RESOURCE_ERROR.NOT_FOUND:
      return 404;
    case RESOURCE_ERROR.NOT_ENROLLED:
    case RESOURCE_ERROR.NOT_PUBLISHED:
    case RESOURCE_ERROR.ACCESS_DENIED:
    case RESOURCE_ERROR.RELATIONSHIP_INVALID:
    case RESOURCE_ERROR.FORBIDDEN:
      return 403;
    case RESOURCE_ERROR.UNAUTHORIZED:
      return 401;
    case RESOURCE_ERROR.DUPLICATE:
      return 409;
    case RESOURCE_ERROR.FILE_REQUIRED:
    case RESOURCE_ERROR.FILE_TYPE_INVALID:
    case RESOURCE_ERROR.FILE_TOO_LARGE:
    case RESOURCE_ERROR.FILE_EMPTY:
    case RESOURCE_ERROR.INVALID_INPUT:
      return 400;
    default:
      return 500;
  }
}

/** Friendly JSON error response for any thrown error (never leaks internals). */
export function toResourceErrorResponse(error: unknown): NextResponse {
  if (error instanceof ResourceError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: statusForCode(error.code) }
    );
  }

  if (error instanceof Error && error.name === "ZodError") {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  console.error("Resource route error:", error);
  return NextResponse.json(
    { success: false, error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}
