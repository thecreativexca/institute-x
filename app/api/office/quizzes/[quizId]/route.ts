import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizById } from "@/lib/office/quizzes/queries";
import { updateQuiz, deleteQuiz } from "@/lib/office/quizzes/mutations";
import { updateQuizSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_READ)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const quiz = await getOfficeQuizById(quizId, user.id, user.role);

    if (!quiz) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Office quiz GET error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const data = {
      title: formData.get("title") as string | undefined,
      description: formData.get("description") as string | undefined,
      instructions: formData.get("instructions") as string | undefined,
      type: formData.get("type") as string | undefined,
      durationMinutes: formData.get("durationMinutes") ? parseInt(formData.get("durationMinutes") as string, 10) : undefined,
      passingPercentage: formData.get("passingPercentage") ? parseInt(formData.get("passingPercentage") as string, 10) : undefined,
      maxAttempts: formData.get("maxAttempts") ? parseInt(formData.get("maxAttempts") as string, 10) : undefined,
      shuffleQuestions: formData.get("shuffleQuestions") === "true" ? true : formData.get("shuffleQuestions") === "false" ? false : undefined,
      shuffleOptions: formData.get("shuffleOptions") === "true" ? true : formData.get("shuffleOptions") === "false" ? false : undefined,
      showCorrectAnswers: formData.get("showCorrectAnswers") === "true" ? true : formData.get("showCorrectAnswers") === "false" ? false : undefined,
      availableFrom: formData.get("availableFrom") as string | null | undefined,
      availableUntil: formData.get("availableUntil") as string | null | undefined,
      moduleId: formData.get("moduleId") as string | null | undefined,
      lessonId: formData.get("lessonId") as string | null | undefined,
      isPublished: formData.get("isPublished") === "true" ? true : formData.get("isPublished") === "false" ? false : undefined,
    };

    const validated = updateQuizSchema.parse(data);

    const result = await updateQuiz(quizId, validated, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office quiz PATCH error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { quizId } = await params;

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const result = await deleteQuiz(quizId, user.id, user.role);

    if ("error" in result) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Office quiz DELETE error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}