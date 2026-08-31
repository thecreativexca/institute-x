import { NextRequest, NextResponse } from "next/server";

import { attemptParamsSchema } from "@/lib/quizzes/validation";
import { submitQuizAttempt } from "@/lib/quizzes/attempts";
import { requireStudentOrResponse, toErrorResponse } from "@/lib/quizzes/http";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ quizId: string; attemptId: string }> }
) {
  const auth = await requireStudentOrResponse();
  if ("response" in auth) return auth.response;

  const parsed = await ctx.params;
  const route = attemptParamsSchema.safeParse(parsed);
  if (!route.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  let reason: "manual" | "expired" = "manual";
  try {
    const body = await request.json();
    if (body && body.reason === "expired") reason = "expired";
  } catch {
    /* body optional — default manual */
  }

  try {
    const result = await submitQuizAttempt({
      studentId: auth.student.id,
      quizId: route.data.quizId,
      attemptId: route.data.attemptId,
      reason,
    });
    return NextResponse.json(
      {
        success: true,
        redirect: `/student/quizzes/${route.data.quizId}/result/${route.data.attemptId}`,
        status: result.status,
      },
      { status: 200 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
