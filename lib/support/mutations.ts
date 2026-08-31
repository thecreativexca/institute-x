import { connectDB } from "@/lib/db/connect";
import { SupportTicket } from "@/models/SupportTicket";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES, type TicketStatus, type TicketPriority, type TicketCategory } from "@/lib/constants";
import { CreateTicketInput, UpdateTicketInput, ReplyTicketInput } from "./validation";
import { notifyTicketCreated, notifyTicketReply, notifyTicketResolved } from "./notifications";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TKT-${year}-${randomPart}`;
}

export async function createSupportTicket(
  input: CreateTicketInput,
  studentId: string
): Promise<{ ticketId: string; ticketNumber: string } | { error: string }> {
  await connectDB();

  if (input.courseId) {
    const enrollment = await Enrollment.findOne({
      student: toObjectId(studentId),
      course: toObjectId(input.courseId),
      status: "active",
    }).lean();
    if (!enrollment) {
      return { error: "You are not enrolled in this course" };
    }
  }

  const student = await User.findById(toObjectId(studentId)).select("name email").lean();
  if (!student) return { error: "Student not found" };

  const ticketNumber = generateTicketNumber();

  const ticket = await SupportTicket.create({
    ticketNumber,
    student: toObjectId(studentId),
    course: input.courseId ? toObjectId(input.courseId) : null,
    subject: input.subject.trim(),
    category: input.category,
    status: TICKET_STATUSES.OPEN,
    priority: TICKET_PRIORITIES.NORMAL,
    messages: [{
      sender: toObjectId(studentId),
      senderType: "student",
      message: input.message.trim(),
      attachmentUrl: input.attachmentUrl ?? undefined,
      attachmentPublicId: input.attachmentPublicId ?? undefined,
      originalFileName: input.originalFileName ?? undefined,
      isInternal: false,
      createdAt: new Date(),
    }],
  });

  await AuditLog.create({
    actorUserId: toObjectId(studentId),
    actorRole: "student",
    action: "support.create",
    entityType: "support_ticket",
    entityId: ticket._id,
    metadata: {
      ticketNumber,
      subject: input.subject,
      category: input.category,
    },
  });

  try {
    await notifyTicketCreated(studentId, student.name, student.email, ticketNumber, input.subject);
  } catch (emailError) {
    console.error("Failed to send ticket created email:", emailError);
  }

  return { ticketId: ticket._id.toString(), ticketNumber };
}

export async function updateSupportTicket(
  ticketId: string,
  input: UpdateTicketInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId));
  if (!ticket) return { error: "Ticket not found" };

  const oldData = {
    status: ticket.status,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo,
  };

  if (input.status !== undefined) {
    const oldStatus = ticket.status;
    ticket.status = input.status;
    if (input.status === TICKET_STATUSES.RESOLVED && oldStatus !== TICKET_STATUSES.RESOLVED) {
      ticket.resolvedAt = new Date();
    }
    if (input.status === TICKET_STATUSES.CLOSED && oldStatus !== TICKET_STATUSES.CLOSED) {
      ticket.closedAt = new Date();
    }
  }

  if (input.priority !== undefined) ticket.priority = input.priority;

  if (input.assignedTo !== undefined) {
    if (input.assignedTo) {
      const assignee = await User.findById(toObjectId(input.assignedTo)).lean();
      if (!assignee) return { error: "Assignee not found" };
      const isStaff = ["super_admin", "office_staff", "content_manager", "faculty"].includes(assignee.role);
      if (!isStaff) return { error: "Can only assign to staff members" };
      ticket.assignedTo = toObjectId(input.assignedTo);
    } else {
      ticket.assignedTo = null;
    }
  }

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  if (input.status !== undefined && input.status !== oldData.status) {
    changedFields.status = { old: oldData.status, new: input.status };
  }
  if (input.priority !== undefined && input.priority !== oldData.priority) {
    changedFields.priority = { old: oldData.priority, new: input.priority };
  }
  if (input.assignedTo !== undefined) {
    const newAssigned = input.assignedTo ? toObjectId(input.assignedTo) : null;
    if (oldData.assignedTo?.toString() !== newAssigned?.toString()) {
      changedFields.assignedTo = { old: oldData.assignedTo?.toString() ?? null, new: newAssigned?.toString() ?? null };
    }
  }

  await ticket.save();

  if (Object.keys(changedFields).length > 0) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "support.update",
      entityType: "support_ticket",
      entityId: ticket._id,
      metadata: { changedFields },
    });
  }

  return { success: true };
}

export async function replyToTicket(
  ticketId: string,
  input: ReplyTicketInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId));
  if (!ticket) return { error: "Ticket not found" };

  const isStaff = ["super_admin", "office_staff", "content_manager", "faculty"].includes(actorRole);
  const isOwner = ticket.student.toString() === actorId;

  if (!isStaff && !isOwner) {
    return { error: "Not authorized to reply to this ticket" };
  }

  if (ticket.status === TICKET_STATUSES.CLOSED) {
    return { error: "Cannot reply to a closed ticket" };
  }

  const senderType: "student" | "staff" = isStaff ? "staff" : "student";
  const newMessage = {
    sender: toObjectId(actorId),
    senderType,
    message: input.message.trim(),
    attachmentUrl: input.attachmentUrl ?? undefined,
    attachmentPublicId: input.attachmentPublicId ?? undefined,
    originalFileName: input.originalFileName ?? undefined,
    isInternal: input.isInternal ?? false,
    createdAt: new Date(),
  };

  ticket.messages.push(newMessage);
  ticket.updatedAt = new Date();

  if (isStaff) {
    if (ticket.status === TICKET_STATUSES.OPEN || ticket.status === TICKET_STATUSES.WAITING_FOR_STUDENT) {
      ticket.status = TICKET_STATUSES.IN_PROGRESS;
    }
  } else {
    if (ticket.status === TICKET_STATUSES.WAITING_FOR_STUDENT || ticket.status === TICKET_STATUSES.IN_PROGRESS) {
      ticket.status = TICKET_STATUSES.IN_PROGRESS;
    }
  }

  await ticket.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "support.reply",
    entityType: "support_ticket",
    entityId: ticket._id,
    metadata: {
      isInternal: input.isInternal ?? false,
      isStaffReply: isStaff,
    },
  });

  if (!input.isInternal) {
    try {
      const student = await User.findById(ticket.student).select("name email").lean();
      const actor = await User.findById(toObjectId(actorId)).select("name").lean();
      if (student && actor) {
        const messageId = newMessage.createdAt.toISOString();
        await notifyTicketReply(
          student._id.toString(),
          student.name,
          student.email,
          ticket.ticketNumber,
          ticket.subject,
          input.message,
          actor.name,
          messageId,
        );
      }
    } catch (emailError) {
      console.error("Failed to send ticket reply email:", emailError);
    }
  }

  return { success: true };
}

export async function resolveTicket(
  ticketId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId));
  if (!ticket) return { error: "Ticket not found" };

  if (ticket.status === TICKET_STATUSES.CLOSED) {
    return { error: "Cannot resolve a closed ticket" };
  }

  ticket.status = TICKET_STATUSES.RESOLVED;
  ticket.resolvedAt = new Date();
  await ticket.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "support.resolve",
    entityType: "support_ticket",
    entityId: ticket._id,
    metadata: {},
  });

  try {
    const student = await User.findById(ticket.student).select("name email").lean();
    if (student) {
      await notifyTicketResolved(
        student._id.toString(),
        student.name,
        student.email,
        ticket.ticketNumber,
        ticket.subject,
      );
    }
  } catch (emailError) {
    console.error("Failed to send ticket resolved email:", emailError);
  }

  return { success: true };
}

export async function closeTicket(
  ticketId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId));
  if (!ticket) return { error: "Ticket not found" };

  ticket.status = TICKET_STATUSES.CLOSED;
  ticket.closedAt = new Date();
  if (!ticket.resolvedAt) ticket.resolvedAt = new Date();
  await ticket.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "support.close",
    entityType: "support_ticket",
    entityId: ticket._id,
    metadata: {},
  });

  return { success: true };
}

export async function reopenTicket(
  ticketId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId));
  if (!ticket) return { error: "Ticket not found" };

  if (ticket.status !== TICKET_STATUSES.RESOLVED && ticket.status !== TICKET_STATUSES.CLOSED) {
    return { error: "Can only reopen resolved or closed tickets" };
  }

  ticket.status = TICKET_STATUSES.OPEN;
  ticket.resolvedAt = null;
  ticket.closedAt = null;
  await ticket.save();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "support.reopen",
    entityType: "support_ticket",
    entityId: ticket._id,
    metadata: {},
  });

  return { success: true };
}