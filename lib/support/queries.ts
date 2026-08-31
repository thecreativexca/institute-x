import { connectDB } from "@/lib/db/connect";
import { SupportTicket } from "@/models/SupportTicket";
import { User } from "@/models/User";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Types } from "mongoose";
import {
  OfficeTicketSummary,
  OfficeTicketDetail,
  StudentTicketSummary,
  StudentTicketDetail,
  TicketMessage,
  SupportFilters,
  SupportSortOptions,
  PaginationParams,
  SupportListResult,
  StudentSupportListResult,
  SupportStats,
} from "./dto";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES, type TicketStatus, type TicketPriority, type TicketCategory } from "@/lib/constants";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface RawTicketMessage {
  _id?: Types.ObjectId;
  id?: string;
  sender: Types.ObjectId | { name?: string | null };
  senderName?: string | null;
  senderType: TicketMessage["senderType"];
  message: string;
  attachmentUrl?: string | null;
  originalFileName?: string | null;
  isInternal?: boolean;
  createdAt: Date | string;
}

function mapTicketMessage(msg: RawTicketMessage): TicketMessage {
  const createdAt = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt);
  const senderName =
    msg.senderName ??
    (typeof msg.sender === "object" && "name" in msg.sender
      ? (msg.sender.name ?? "Unknown")
      : "Unknown");
  return {
    id: msg._id?.toString() ?? msg.id ?? "",
    senderId: msg.sender.toString(),
    senderName,
    senderType: msg.senderType,
    message: msg.message,
    attachmentUrl: msg.attachmentUrl,
    originalFileName: msg.originalFileName,
    isInternal: msg.isInternal ?? false,
    createdAt: createdAt.toISOString(),
  };
}

async function getAssignedStaffMap(ticketIds: Types.ObjectId[]): Promise<Map<string, { id: string; name: string } | null>> {
  const tickets = await SupportTicket.find({ _id: { $in: ticketIds } }).select("assignedTo").lean();
  const assignedToIds = tickets
    .filter((t) => t.assignedTo)
    .map((t) => t.assignedTo!.toString());

  const staff = assignedToIds.length > 0
    ? await User.find({ _id: { $in: assignedToIds.map(toObjectId) } }).select("name").lean()
    : [];
  const staffMap = new Map(staff.map((s) => [s._id.toString(), { id: s._id.toString(), name: s.name }]));

  const result = new Map<string, { id: string; name: string } | null>();
  for (const ticket of tickets) {
    const key = ticket._id.toString();
    result.set(key, ticket.assignedTo ? staffMap.get(ticket.assignedTo.toString()) ?? null : null);
  }
  return result;
}

export async function getOfficeSupportTickets(
  filters: SupportFilters,
  sort: SupportSortOptions,
  pagination: PaginationParams,
  userId: string,
  role: string
): Promise<SupportListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    const students = await User.find({ role: "student", $or: [{ name: regex }, { email: regex }] })
      .select("_id")
      .lean();
    const studentIds = students.map((s) => s._id);
    query.student = { $in: studentIds };
  }

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.priority && filters.priority !== "all") {
    query.priority = filters.priority;
  }

  if (filters.category && filters.category !== "all") {
    query.category = filters.category;
  }

  if (filters.assignedToMe) {
    query.assignedTo = toObjectId(userId);
  }

  if (filters.unassigned) {
    query.assignedTo = null;
  }

  if (filters.courseId && Types.ObjectId.isValid(filters.courseId)) {
    query.course = toObjectId(filters.courseId);
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .populate({ path: "student", select: "name email" })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  if (tickets.length === 0) {
    return {
      tickets: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const ticketIds = tickets.map((t) => t._id);
  const assignedMap = await getAssignedStaffMap(ticketIds);

  const courseIds = tickets
    .filter((t) => t.course)
    .map((t) => t.course!);
  const courses = courseIds.length > 0
    ? await Course.find({ _id: { $in: courseIds } }).select("name").lean()
    : [];
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c.name]));

  const ticketSummaries: OfficeTicketSummary[] = tickets.map((ticket) => {
    const student = ticket.student as unknown as { _id: Types.ObjectId; name: string; email: string };
    const assigned = assignedMap.get(ticket._id.toString());
    const courseName = ticket.course ? courseMap.get(ticket.course.toString()) ?? null : null;

    return {
      id: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      studentId: student._id.toString(),
      studentName: student.name,
      studentEmail: student.email,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      assignedToId: assigned?.id ?? null,
      assignedToName: assigned?.name ?? null,
      courseId: ticket.course?.toString() ?? null,
      courseName,
      lastMessageAt: ticket.updatedAt.toISOString(),
      createdAt: ticket.createdAt.toISOString(),
      resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
      closedAt: ticket.closedAt?.toISOString() ?? null,
    };
  });

  return {
    tickets: ticketSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getStudentSupportTickets(
  studentId: string,
  filters: { search?: string; status?: string },
  sort: { field: string; direction: "asc" | "desc" },
  pagination: PaginationParams
): Promise<StudentSupportListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { student: toObjectId(studentId) };

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    query.subject = regex;
  }

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [tickets, total] = await Promise.all([
    SupportTicket.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    SupportTicket.countDocuments(query),
  ]);

  const ticketSummaries: StudentTicketSummary[] = tickets.map((ticket) => ({
    id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    lastMessageAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
  }));

  return {
    tickets: ticketSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeTicketDetail(
  ticketId: string,
  userId: string,
  role: string
): Promise<OfficeTicketDetail | null> {
  await connectDB();

  const ticket = await SupportTicket.findById(toObjectId(ticketId))
    .populate({ path: "student", select: "name email" })
    .lean();

  if (!ticket) return null;

  const student = ticket.student as unknown as { _id: Types.ObjectId; name: string; email: string };
  const assigned = ticket.assignedTo
    ? await User.findById(ticket.assignedTo).select("name").lean()
    : null;
  const courseName = ticket.course
    ? (await Course.findById(ticket.course).select("name").lean())?.name ?? null
    : null;

  return {
    id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber,
    studentId: student._id.toString(),
    studentName: student.name,
    studentEmail: student.email,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    assignedToId: ticket.assignedTo?.toString() ?? null,
    assignedToName: assigned?.name ?? null,
    courseId: ticket.course?.toString() ?? null,
    courseName,
    lastMessageAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    closedAt: ticket.closedAt?.toISOString() ?? null,
    messages: ticket.messages.map(mapTicketMessage),
  };
}

export async function getStudentTicketDetail(
  ticketId: string,
  studentId: string
): Promise<StudentTicketDetail | null> {
  await connectDB();

  const ticket = await SupportTicket.findOne({ _id: toObjectId(ticketId), student: toObjectId(studentId) }).lean();

  if (!ticket) return null;

  return {
    id: ticket._id.toString(),
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    status: ticket.status,
    priority: ticket.priority,
    lastMessageAt: ticket.updatedAt.toISOString(),
    createdAt: ticket.createdAt.toISOString(),
    resolvedAt: ticket.resolvedAt?.toISOString() ?? null,
    messages: ticket.messages
      .filter((m) => !m.isInternal)
      .map(mapTicketMessage),
  };
}

export async function getSupportStats(): Promise<SupportStats> {
  await connectDB();

  const [open, inProgress, waiting, unassigned, high, urgent] = await Promise.all([
    SupportTicket.countDocuments({ status: TICKET_STATUSES.OPEN }),
    SupportTicket.countDocuments({ status: TICKET_STATUSES.IN_PROGRESS }),
    SupportTicket.countDocuments({ status: TICKET_STATUSES.WAITING_FOR_STUDENT }),
    SupportTicket.countDocuments({ assignedTo: null, status: { $in: [TICKET_STATUSES.OPEN, TICKET_STATUSES.IN_PROGRESS, TICKET_STATUSES.WAITING_FOR_STUDENT] } }),
    SupportTicket.countDocuments({ priority: TICKET_PRIORITIES.HIGH }),
    SupportTicket.countDocuments({ priority: TICKET_PRIORITIES.URGENT }),
  ]);

  return { open, inProgress, waiting, unassigned, high, urgent };
}