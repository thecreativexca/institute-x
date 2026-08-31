import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizzes, getOfficeQuizById } from "@/lib/office/quizzes/queries";
import { createQuiz, duplicateQuiz, getQuizPublishReadiness } from "@/lib/office/quizzes/mutations";
import { getQuizModules, getModuleLessons } from "@/lib/office/quizzes/mutations";
import { createQuizSchema, quizFiltersSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = quizFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const vp = parsed.data;

    const filters = {
      search: vp.search,
      courseId: vp.courseId,
      moduleId: vp.moduleId,
      type: vp.type,
      status: vp.status,
    };

    const sort = {
      field: vp.sort,
      direction: vp.direction,
    };

    const pagination = {
      page: vp.page,
      limit: vp.limit,
    };

    const result = await getOfficeQuizzes(filters, sort, pagination, user.id, user.role);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Office quizzes GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_MANAGE)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action === "create") {
      const data = {
        courseId: formData.get("courseId") as string,
        moduleId: formData.get("moduleId") as string | null,
        lessonId: formData.get("lessonId") as string | null,
        title: formData.get("title") as string,
        description: formData.get("description") as string | undefined,
        instructions: formData.get("instructions") as string | undefined,
        type: formData.get("type") as string,
        durationMinutes: formData.get("durationMinutes") ? parseInt(formData.get("durationMinutes") as string, 10) : undefined,
        passingPercentage: parseInt(formData.get("passingPercentage") as string, 10),
        maxAttempts: formData.get("maxAttempts") ? parseInt(formData.get("maxAttempts") as string, 10) : undefined,
        shuffleQuestions: formData.get("shuffleQuestions") === "true",
        shuffleOptions: formData.get("shuffleOptions") === "true",
        showCorrectAnswers: formData.get("showCorrectAnswers") === "true",
        availableFrom: formData.get("availableFrom") as string | null,
        availableUntil: formData.get("availableUntil") as string | null,
        isPublished: formData.get("isPublished") === "true",
      };

      const validated = createQuizSchema.parse(data);

      const result = await createQuiz(validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, quizId: result.quizId });
    }

    if (action === "duplicate") {
      const quizId = formData.get("quizId") as string;
      if (!quizId) {
        return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
      }
      const result = await duplicateQuiz(quizId, user.id, user.role);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, quizId: result.quizId });
    }

    if (action === "publish-readiness") {
      const quizId = formData.get("quizId") as string;
      if (!quizId) {
        return NextResponse.json({ error: "Quiz ID required" }, { status: 400 });
      }
      const result = await getQuizPublishReadiness(quizId, user.id, user.role);
      return NextResponse.json(result);
    }

    if (action === "modules") {
      const courseId = formData.get("courseId") as string;
      if (!courseId) {
        return NextResponse.json({ error: "Course ID required" }, { status: 400 });
      }
      const modules = await getQuizModules(courseId);
      return NextResponse.json({ modules });
    }

    if (action === "lessons") {
      const moduleId = formData.get("moduleId") as string;
      if (!moduleId) {
        return NextResponse.json({ error: "Module ID required" }, { status: 400 });
      }
      const lessons = await getModuleLessons(moduleId);
      return NextResponse.json({ lessons });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office quizzes POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}