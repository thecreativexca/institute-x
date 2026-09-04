import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { Course } from "@/models/Course";
import type { CategoryListResult, CategorySort, CategoryStatusFilter } from "./dto";

const SORTS: Record<CategorySort, Record<string, 1 | -1>> = {
  sort_order: { sortOrder: 1, name: 1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
};

export async function listCategories(params: {
  search?: string;
  status: CategoryStatusFilter;
  sort: CategorySort;
  page: number;
  pageSize: number;
}): Promise<CategoryListResult> {
  await connectDB();

  const query: Record<string, unknown> = {};
  const search = params.search?.trim();
  if (search) {
    const value = new RegExp(escapeRegex(search), "i");
    query.$or = [{ name: value }, { slug: value }, { description: value }];
  }
  if (params.status === "active") query.isActive = { $ne: false };
  if (params.status === "inactive") query.isActive = false;

  const [docs, total, allCount, activeCount, linkedCourses] = await Promise.all([
    Category.find(query)
      .sort(SORTS[params.sort])
      .skip((params.page - 1) * params.pageSize)
      .limit(params.pageSize)
      .lean(),
    Category.countDocuments(query),
    Category.countDocuments({}),
    Category.countDocuments({ isActive: { $ne: false } }),
    Course.countDocuments({}),
  ]);

  const ids = docs.map((category) => category._id);
  const counts = ids.length
    ? await Course.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { category: { $in: ids } } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ])
    : [];
  const countByCategory = new Map(counts.map((row) => [String(row._id), row.count]));

  return {
    categories: docs.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      thumbnailUrl: category.thumbnailUrl ?? null,
      isActive: category.isActive !== false,
      sortOrder: category.sortOrder ?? 0,
      seoTitle: category.seoTitle ?? "",
      seoDescription: category.seoDescription ?? "",
      courseCount: countByCategory.get(category._id.toString()) ?? 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    })),
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
    summary: {
      total: allCount,
      active: activeCount,
      inactive: Math.max(0, allCount - activeCount),
      linkedCourses,
    },
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
