import { NextRequest, NextResponse } from "next/server";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentSupportTickets } from "@/lib/support/queries";
import { createSupportTicket } from "@/lib/support/mutations";
import { createTicketSchema, studentSupportFiltersSchema } from "@/lib/support/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { user: student, error } = await getValidatedStudent();

    if (!student || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = Object.fromEntries(searchParams.entries());

    const parsed = studentSupportFiltersSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const vp = parsed.data;

    const filters = {
      search: vp.search,
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

    const result = await getStudentSupportTickets(student.id, filters, sort, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Student support GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user: student, error } = await getValidatedStudent();

    if (!student || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const data = {
      subject: formData.get("subject") as string,
      category: formData.get("category") as string,
      message: formData.get("message") as string,
      courseId: formData.get("courseId") as string | null,
      attachmentUrl: formData.get("attachmentUrl") as string | null,
      attachmentPublicId: formData.get("attachmentPublicId") as string | null,
      originalFileName: formData.get("originalFileName") as string | null,
    };

    const validated = createTicketSchema.parse(data);

    const result = await createSupportTicket(validated, student.id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, ticketId: result.ticketId, ticketNumber: result.ticketNumber });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Student support POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}