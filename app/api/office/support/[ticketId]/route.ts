import { NextRequest, NextResponse } from "next/server";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeTicketDetail } from "@/lib/support/queries";
import { updateSupportTicket, replyToTicket, resolveTicket, closeTicket, reopenTicket } from "@/lib/support/mutations";
import { updateTicketSchema, replyTicketSchema } from "@/lib/support/validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { ticketId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!hasPermission(user.role, PERMISSIONS.SUPPORT_READ)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const ticket = await getOfficeTicketDetail(ticketId, user.id, user.role);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error("Office support ticket GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { user } = await getValidatedSession();
    const { ticketId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessOffice(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    if (action === "update") {
      if (!hasPermission(user.role, PERMISSIONS.SUPPORT_ASSIGN) &&
          !hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const data = {
        status: formData.get("status") as string | undefined,
        priority: formData.get("priority") as string | undefined,
        assignedTo: formData.get("assignedTo") as string | null | undefined,
      };

      const validated = updateTicketSchema.parse(data);

      const result = await updateSupportTicket(ticketId, validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reply") {
      if (!hasPermission(user.role, PERMISSIONS.SUPPORT_REPLY)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const data = {
        message: formData.get("message") as string,
        isInternal: formData.get("isInternal") === "true",
        attachmentUrl: formData.get("attachmentUrl") as string | null | undefined,
        attachmentPublicId: formData.get("attachmentPublicId") as string | null | undefined,
        originalFileName: formData.get("originalFileName") as string | null | undefined,
      };

      const validated = replyTicketSchema.parse(data);

      const result = await replyToTicket(ticketId, validated, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "resolve") {
      if (!hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const result = await resolveTicket(ticketId, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "close") {
      if (!hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const result = await closeTicket(ticketId, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reopen") {
      if (!hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE)) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
      }

      const result = await reopenTicket(ticketId, user.id, user.role);

      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: error }, { status: 400 });
    }
    console.error("Office support ticket PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}