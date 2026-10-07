import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth/helpers";
import { recordAuditEvent } from "@/lib/audit/log";
import {
  decodeCurriculumCsv,
  importCurriculumCsv,
  MAX_CURRICULUM_CSV_BYTES,
  parseCurriculumCsv,
  previewCurriculumCsv,
} from "@/lib/office/courses/curriculum-csv";
import {
  COURSE_PERMISSIONS,
  PermissionDeniedError,
  requireCourseScope,
} from "@/lib/office/courses/permissions";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  const auth = await requireAdminApi();
  if (auth.errorResponse) return auth.errorResponse;

  const { courseId } = await context.params;
  try {
    const user = await requireCourseScope(auth.user, COURSE_PERMISSIONS.MODULES, courseId);
    await requireCourseScope(user, COURSE_PERMISSIONS.LESSONS, courseId);

    const formData = await request.formData();
    const operation = formData.get("operation");
    const file = formData.get("file");
    if (operation !== "preview" && operation !== "import") {
      return NextResponse.json({ success: false, error: "Invalid import operation." }, { status: 400 });
    }
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      return NextResponse.json({ success: false, error: "Please choose a .csv file." }, { status: 400 });
    }
    if (file.size === 0 || file.size > MAX_CURRICULUM_CSV_BYTES) {
      return NextResponse.json(
        { success: false, error: "CSV files must be between 1 byte and 2 MB." },
        { status: 400 }
      );
    }

    const text = decodeCurriculumCsv(await file.arrayBuffer());
    const parsed = await parseCurriculumCsv(text);
    const preview = await previewCurriculumCsv(courseId, parsed);

    if (operation === "preview") {
      return NextResponse.json({ success: true, preview });
    }
    if (parsed.errors.length > 0 || parsed.invalidRows > 0) {
      return NextResponse.json(
        { success: false, error: "Fix every CSV validation error before importing.", preview },
        { status: 422 }
      );
    }

    const result = await importCurriculumCsv(courseId, parsed);
    await recordAuditEvent({
      actorUserId: user.id,
      actorRole: user.role,
      action: "curriculum.import",
      entityType: "course",
      entityId: courseId,
      metadata: { fileName: file.name, ...result },
    });
    revalidatePath(`/office/courses/${courseId}/curriculum`);
    revalidatePath(`/office/courses/${courseId}`);
    revalidatePath("/student/courses");
    return NextResponse.json({ success: true, result });
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    console.error("Curriculum CSV import failed:", error);
    const message = error instanceof Error ? error.message : "Curriculum import failed.";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

