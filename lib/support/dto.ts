import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES, type TicketStatus, type TicketPriority, type TicketCategory } from "@/lib/constants";

export interface OfficeTicketSummary {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  assignedToId?: string | null;
  assignedToName?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  lastMessageAt: string;
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

export interface OfficeTicketDetail extends OfficeTicketSummary {
  messages: TicketMessage[];
}

export interface StudentTicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  lastMessageAt: string;
  createdAt: string;
  resolvedAt: string | null;
}

export interface StudentTicketDetail extends StudentTicketSummary {
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: "student" | "staff";
  message: string;
  attachmentUrl?: string | null;
  originalFileName?: string | null;
  isInternal: boolean;
  createdAt: string;
}

export interface SupportFilters {
  search?: string;
  status?: TicketStatus | "all";
  priority?: TicketPriority | "all";
  category?: TicketCategory | "all";
  assignedToMe?: boolean;
  unassigned?: boolean;
  courseId?: string;
}

export interface SupportSortOptions {
  field: "lastMessageAt" | "createdAt" | "priority" | "status";
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SupportListResult {
  tickets: OfficeTicketSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StudentSupportListResult {
  tickets: StudentTicketSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateTicketInput {
  subject: string;
  category: TicketCategory;
  message: string;
  courseId?: string | null;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  originalFileName?: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string | null;
}

export interface ReplyTicketInput {
  message: string;
  isInternal?: boolean;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  originalFileName?: string;
}

export interface SupportStats {
  open: number;
  inProgress: number;
  waiting: number;
  unassigned: number;
  high: number;
  urgent: number;
}