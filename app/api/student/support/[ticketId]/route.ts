import { NextRequest, NextResponse } from "next/server";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { getStudentTicketDetail } from "@/lib/support/queries";
import { replyToTicket } from "@/lib/support/mutations";
import { replyTicketSchema } from "@/lib/support/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { user: student, error } = await getValidatedStudent();
    const { ticketId } = await params;

    if (!student || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ticket = await getStudentTicketDetail(ticketId, student.id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Student support ticket GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { user: student, error } = await getValidatedStudent();
    const { ticketId } = await params;

    if (!student || error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const data = {
      message: formData.get("message") as string,
      isInternal: false,
      attachmentUrl: formData.get("attachmentUrl") as string | null | undefined,
      attachmentPublicId: formData.get("attachmentPublicId") as string | null | undefined,
      originalFileName: formData.get("originalFileName") as string | null | undefined,
    };

    const validated = replyTicketSchema.parse(data);

    const result = await replyToTicket(ticketId, validated, student.id, "student");

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Student support ticket PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}