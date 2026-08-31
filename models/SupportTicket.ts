import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  type TicketPriority,
  type TicketStatus,
  type TicketCategory,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { User } from "./User";
import { Course } from "./Course";

/** Conversation thread inside a support ticket. */
export interface ITicketMessage {
  sender: Types.ObjectId;
  senderType: "student" | "staff";
  message: string;
  attachmentUrl?: string;
  attachmentPublicId?: string;
  originalFileName?: string;
  isInternal: boolean;
  createdAt: Date;
}

/** SupportTicket — student queries handled by office staff. */
export interface ISupportTicket {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  ticketNumber: string;
  student: Types.ObjectId;
  course?: Types.ObjectId | null;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: Types.ObjectId | null;
  messages: ITicketMessage[];
  resolvedAt?: Date | null;
  closedAt?: Date | null;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
    },
    senderType: {
      type: String,
      enum: ["student", "staff"],
      required: true,
    },
    message: { type: String, required: true, trim: true },
    attachmentUrl: { type: String, trim: true },
    attachmentPublicId: { type: String, trim: true },
    originalFileName: { type: String, trim: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: () => new Date() },
  },
  { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      default: null,
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORIES),
      default: TICKET_CATEGORIES.OTHER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUSES),
      default: TICKET_STATUSES.OPEN,
      index: true,
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITIES),
      default: TICKET_PRIORITIES.NORMAL,
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: User.modelName,
      default: null,
      index: true,
    },
    messages: { type: [TicketMessageSchema], default: [] },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

SupportTicketSchema.index({ status: 1, updatedAt: -1 });
SupportTicketSchema.index({ student: 1, status: 1 });
SupportTicketSchema.index({ assignedTo: 1, status: 1 });
SupportTicketSchema.index({ createdAt: -1 });

export const SupportTicket = defineModel("SupportTicket", SupportTicketSchema);