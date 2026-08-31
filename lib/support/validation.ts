import { z } from "zod";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES, type TicketStatus, type TicketPriority, type TicketCategory } from "@/lib/constants";

export const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  category: z.enum(Object.values(TICKET_CATEGORIES) as [TicketCategory, ...TicketCategory[]]),
  message: z.string().min(1, "Message is required").max(10000, "Message too long"),
  courseId: z.string().optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentPublicId: z.string().optional().nullable(),
  originalFileName: z.string().optional().nullable(),
});

export const updateTicketSchema = z.object({
  status: z.enum(Object.values(TICKET_STATUSES) as [TicketStatus, ...TicketStatus[]]).optional(),
  priority: z.enum(Object.values(TICKET_PRIORITIES) as [TicketPriority, ...TicketPriority[]]).optional(),
  assignedTo: z.string().optional().nullable(),
});

export const replyTicketSchema = z.object({
  message: z.string().min(1, "Message is required").max(10000, "Message too long"),
  isInternal: z.boolean().optional().default(false),
  attachmentUrl: z.string().url().optional().nullable(),
  attachmentPublicId: z.string().optional().nullable(),
  originalFileName: z.string().optional().nullable(),
});

export const supportFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["open", "in_progress", "waiting_for_student", "resolved", "closed", "all"]).optional().default("all"),
  priority: z.enum(["low", "normal", "high", "urgent", "all"]).optional().default("all"),
  category: z.enum(["course_access", "payment", "technical", "assignment", "quiz", "certificate", "account", "other", "all"]).optional().default("all"),
  assignedToMe: z.boolean().optional(),
  unassigned: z.boolean().optional(),
  courseId: z.string().optional(),
  sort: z.enum(["lastMessageAt", "createdAt", "priority", "status"]).optional().default("lastMessageAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const studentSupportFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["open", "in_progress", "waiting_for_student", "resolved", "closed", "all"]).optional().default("all"),
  sort: z.enum(["lastMessageAt", "createdAt", "status"]).optional().default("lastMessageAt"),
  direction: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;
export type SupportFiltersInput = z.infer<typeof supportFiltersSchema>;
export type StudentSupportFiltersInput = z.infer<typeof studentSupportFiltersSchema>;