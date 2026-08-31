import { NextRequest, NextResponse } from "next/server";

import { quizIdParamSchema } from "@/lib/quizzes/validation";
import { startQuizAttempt } from "@/lib/quizzes/attempts";
import { requireStudentOrResponse, toErrorResponse } from "@/lib/quizzes/http";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ quizId: string }> }
) {
  const auth = await requireStudentOrResponse();
  if ("response" in auth) return auth.response;

  const parsed = await ctx.params;
  const route = quizIdParamSchema.safeParse(parsed);
  if (!route.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  try {
    const result = await startQuizAttempt(
      auth.student.id,
      route.data.quizId
    );
    return NextResponse.json(
      {
        success: true,
        attemptId: result.attemptId,
        redirect: `/student/quizzes/${result.quizId}/attempt/${result.attemptId}`,
      },
      { status: 201 }
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}

