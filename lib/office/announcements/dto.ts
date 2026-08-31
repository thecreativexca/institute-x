import { AUDIENCES, type Audience } from "@/lib/constants";

export interface OfficeAnnouncementSummary {
  id: string;
  title: string;
  audience: Audience;
  courseId?: string | null;
  courseName?: string | null;
  isActive: boolean;
  publishedAt: string | null;
  createdById: string;
  createdByName: string;
  updatedAt: string;
}

export interface OfficeAnnouncementDetail extends OfficeAnnouncementSummary {
  body: string;
  sendEmail: boolean;
  createdAt: string;
}

export interface AnnouncementFilters {
  search?: string;
  audience?: Audience | "all";
  status?: "active" | "inactive" | "all";
}

export interface AnnouncementSortOptions {
  field: "updatedAt" | "publishedAt" | "createdAt" | "title";
  direction: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface AnnouncementListResult {
  announcements: OfficeAnnouncementSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  audience: Audience;
  courseId?: string | null;
  isActive?: boolean;
  sendEmail?: boolean;
}

export interface UpdateAnnouncementInput {
  title?: string;
  body?: string;
  audience?: Audience;
  courseId?: string | null;
  isActive?: boolean;
  sendEmail?: boolean;
}

export interface AnnouncementAudienceResult {
  studentIds: string[];
  count: number;
}