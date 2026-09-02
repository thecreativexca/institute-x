import type { Types } from "mongoose";
import { Schema } from "mongoose";

import {
  SESSION_STATUSES,
  type SessionStatus,
} from "@/lib/constants";

import { defineModel } from "@/lib/mongodb/model-registry";
import { Course } from "./Course";

/**
 * Session — a scheduled offline/venue class for a course.
 *
 * Admin schedules venue-based classes (room/hall, date + time window) against a
 * course. Students enrolled in the course see upcoming sessions in their portal.
 */
export interface ISession {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  course: Types.ObjectId;
  title: string;
  /** Calendar date the class takes place on. */
  date: Date;
  /** Local wall-clock "HH:mm" start, e.g. "09:30". Optional: time can be announced later. */
  startTime?: string;
  /** Local wall-clock "HH:mm" end, e.g. "11:30". */
  endTime?: string;
  /** Venue / room / hall name. */
  venue: string;
  address?: string;
  instructorName?: string;
  notes?: string;
  status: SessionStatus;
  /** Office-only display control. */
  isDisplayed: boolean;
  sortOrder: number;
}

const SessionSchema = new Schema<ISession>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: Course.modelName,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, trim: true, maxlength: 5 },
    endTime: { type: String, trim: true, maxlength: 5 },
    venue: { type: String, required: true, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 300 },
    instructorName: { type: String, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUSES),
      default: SESSION_STATUSES.SCHEDULED,
      index: true,
    },
    isDisplayed: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SessionSchema.index({ course: 1, date: 1, sortOrder: 1 });
SessionSchema.index({ date: 1, status: 1 });

export const Session = defineModel("Session", SessionSchema);
