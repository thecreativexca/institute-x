import type { SessionStatus } from "@/lib/constants";

/** Safe DTO for the office Sessions (offline/venue class) area. */

export interface OfficeSessionRow {
  id: string;
  courseId: string;
  courseName: string;
  courseStatus?: string;
  title: string;
  /** Calendar date key "yyyy-mm-dd" (local wall-clock). */
  date: string;
  /** "HH:mm" local start time. */
  startTime: string;
  /** "HH:mm" local end time, if any. */
  endTime: string;
  venue: string;
  address: string;
  instructorName: string;
  notes: string;
  status: SessionStatus;
  isDisplayed: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface SessionFormValues {
  courseId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  instructorName: string;
  notes: string;
  status: SessionStatus;
  isDisplayed: boolean;
}

export interface SessionCourseOption {
  id: string;
  name: string;
}

export interface OfficeSessionsResult {
  sessions: OfficeSessionRow[];
  total: number;
}

export interface OfficeSessionFilters {
  courseId?: string;
  status?: SessionStatus | "ALL";
  /** When true only today-and-later sessions are returned. */
  upcoming?: boolean;
}
