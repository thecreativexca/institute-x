import { NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { QuizError } from "./errors";
import { QUIZ_ACCESS_ERROR } from "./types";

/**
 * Resolves the authenticated student session, or returns a NextResponse used
 * to short-circuit the route. Mirrors the auth used by every student page.
 */
export async function requireStudentOrResponse(): Promise<
  | { student: { id: string } }
  | { response: NextResponse }
> {
  const { user, error } = await getValidatedStudent();
  if (!user || error) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      ),
    };
  }
  return { student: { id: user.id } };
}

function statusForCode(code?: string): number {
  switch (code) {
    case QUIZ_ACCESS_ERROR.NOT_PUBLISHED:
    case QUIZ_ACCESS_ERROR.NOT_AVAILABLE_YET:
    case QUIZ_ACCESS_ERROR.NO_LONGER_AVAILABLE:
    case QUIZ_ACCESS_ERROR.NO_QUESTIONS:
    case QUIZ_ACCESS_ERROR.ATTEMPT_LIMIT:
      return 403;
    case QUIZ_ACCESS_ERROR.ATTEMPT_EXPIRED:
    case QUIZ_ACCESS_ERROR.ATTEMPT_INVALID:
    case QUIZ_ACCESS_ERROR.NOT_ENROLLED:
      return 403;
    case QUIZ_ACCESS_ERROR.INVALID_QUESTION:
    case QUIZ_ACCESS_ERROR.INVALID_OPTION:
    case QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND:
      return 400;
    default:
      return 400;
  }
}

/** Friendly JSON error response for any thrown error (never leaks internals). */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof QuizError) {
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

  console.error("Quiz route error:", error);
  return NextResponse.json(
    { success: false, error: "An unexpected error occurred. Please try again." },
    { status: 500 }
  );
}
