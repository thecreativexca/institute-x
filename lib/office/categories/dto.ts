export type CategoryStatusFilter = "all" | "active" | "inactive";
export type CategorySort = "sort_order" | "name_asc" | "name_desc" | "newest" | "oldest";

export interface CategoryFormInput {
  name: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
}

export interface CategoryListItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResult {
  categories: CategoryListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: { total: number; active: number; inactive: number; linkedCourses: number };
}

export interface CategoryActionResult {
  ok: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  reused?: boolean;
  category?: { id: string; name: string };
}
