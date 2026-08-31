import { NextRequest, NextResponse } from "next/server";

import { attemptParamsSchema, saveAnswerSchema } from "@/lib/quizzes/validation";
import { saveAttemptAnswer } from "@/lib/quizzes/attempts";
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid answer data." },
      { status: 400 }
    );
  }

  const { success, data } = saveAnswerSchema.safeParse(body);
  if (!success || data.attemptId !== route.data.attemptId) {
    return NextResponse.json(
      { success: false, error: "Invalid answer data." },
      { status: 400 }
    );
  }

  try {
    await saveAttemptAnswer({
      studentId: auth.student.id,
      quizId: route.data.quizId,
      attemptId: route.data.attemptId,
      questionId: data.questionId,
      selectedOptionId: data.selectedOptionId,
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
