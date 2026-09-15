import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessAdmin, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeQuizzes } from "@/lib/office/quizzes/queries";
import { createQuiz, duplicateQuiz, getQuizPublishReadiness } from "@/lib/office/quizzes/mutations";
import { getQuizModules, getModuleLessons } from "@/lib/office/quizzes/mutations";
import { createQuizSchema, quizFiltersSchema } from "@/lib/office/quizzes/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessAdmin(user.role)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.QUIZZES_READ)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get("action");
    if (action === "modules") {
      const courseId = request.nextUrl.searchParams.get("courseId");
      if (!courseId || !/^[a-f\d]{24}$/i.test(courseId)) return NextResponse.json({ error: "Valid course ID required" }, { status: 400 });
      const modules = await getQuizModules(courseId);
      return NextResponse.json({ modules: modules.map((m) => ({ id: m._id.toString(), title: m.title })) });
    }
    if (action === "lessons") {
      const moduleId = request.nextUrl.searchParams.get("moduleId");
      if (!moduleId || !/^[a-f\d]{24}$/i.test(moduleId)) return NextResponse.json({ error: "Valid module ID required" }, { status: 400 });
      const lessons = await getModuleLessons(moduleId);
      return NextResponse.json({ lessons: lessons.map((l) => ({ id: l._id.toString(), title: l.title })) });
    }
    if (action === "publish-readiness") {
      const quizId = request.nextUrl.searchParams.get("quizId");
      if (!quizId || !/^[a-f\d]{24}$/i.test(quizId)) return NextResponse.json({ error: "Valid quiz ID required" }, { status: 400 });
      return NextResponse.json(await getQuizPublishReadiness(quizId, user.id, user.role));
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = quizFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid query parameters", details: parsed.error }, { status: 400 });
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
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getValidatedSession();

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
    const action = formData.get("action") as string;

    if (action === "create") {
      const isoDate = (field: string) => {
        const value = formData.get(field);
        if (!value) return null;
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toISOString();
      };
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
        availableFrom: isoDate("availableFrom"),
        availableUntil: isoDate("availableUntil"),
        isPublished: false,
      };

      const parsed = createQuizSchema.safeParse(data);
      if (!parsed.success) {
        return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
      }
      const validated = parsed.data;

      const result = await createQuiz(validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true, quizId: result.quizId });
    }

    if (action === "duplicate") {
      const quizId = formData.get("quizId") as string;
      if (!quizId) {
        return NextResponse.json({ success: false, error: "Quiz ID required" }, { status: 400 });
      }
      const result = await duplicateQuiz(quizId, user.id, user.role);
      if ("error" in result) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, quizId: result.quizId });
    }

    if (action === "publish-readiness") {
      const quizId = formData.get("quizId") as string;
      if (!quizId) {
        return NextResponse.json({ success: false, error: "Quiz ID required" }, { status: 400 });
      }
      const result = await getQuizPublishReadiness(quizId, user.id, user.role);
      return NextResponse.json(result);
    }

    if (action === "modules") {
      const courseId = formData.get("courseId") as string;
      if (!courseId) {
        return NextResponse.json({ success: false, error: "Course ID required" }, { status: 400 });
      }
      const modules = await getQuizModules(courseId);
      return NextResponse.json({ modules });
    }

    if (action === "lessons") {
      const moduleId = formData.get("moduleId") as string;
      if (!moduleId) {
        return NextResponse.json({ success: false, error: "Module ID required" }, { status: 400 });
      }
      const lessons = await getModuleLessons(moduleId);
      return NextResponse.json({ lessons });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ success: false, error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office quizzes POST error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
