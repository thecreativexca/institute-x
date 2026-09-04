import type { Metadata } from "next";
import Link from "next/link";
import { FolderCheck, FolderClock, FolderTree, Library } from "lucide-react";

import { CategoriesManager } from "@/components/office/categories/categories-manager";
import { OfficeShell } from "@/components/office/OfficeShell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import { listCategories } from "@/lib/office/categories/queries";

export const metadata: Metadata = {
  title: "Categories — Office Portal",
  description: "Manage course categories and public catalog organization.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const STATUS_VALUES = ["all", "active", "inactive"] as const;
const SORT_VALUES = ["sort_order", "name_asc", "name_desc", "newest", "oldest"] as const;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requireAdmin();
  if (!user) return null;
  const params = await searchParams;
  const search = single(params.search);
  const status = enumValue(single(params.status), STATUS_VALUES, "all");
  const sort = enumValue(single(params.sort), SORT_VALUES, "sort_order");
  const page = positiveInt(single(params.page));
  const result = await listCategories({ search, status, sort, page, pageSize: PAGE_SIZE });

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Catalog structure</p>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Categories</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Organize courses for staff and students. Inactive categories stay in the database but can be hidden from discovery.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Category summary">
          <Summary icon={FolderTree} label="Total categories" value={result.summary.total} />
          <Summary icon={FolderCheck} label="Active" value={result.summary.active} />
          <Summary icon={FolderClock} label="Inactive" value={result.summary.inactive} />
          <Summary icon={Library} label="Linked courses" value={result.summary.linkedCourses} />
        </section>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <form method="GET" className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_13rem_auto_auto] md:items-end">
              <label className="text-sm font-medium text-slate-700">
                Search
                <input
                  name="search"
                  defaultValue={search}
                  placeholder="Name, slug or description…"
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary-600/30"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select name="status" defaultValue={status} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Sort
                <select name="sort" defaultValue={sort} className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm">
                  <option value="sort_order">Sort order</option>
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
              <button className={buttonVariants("primary", "md")}>Apply</button>
              <Link href="/office/categories" className={buttonVariants("outline", "md")}>Clear</Link>
            </form>
          </CardContent>
        </Card>

        <CategoriesManager categories={result.categories} />

        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          total={result.total}
          params={params}
        />
      </div>
    </OfficeShell>
  );
}

function Summary({ icon: Icon, label, value }: { icon: typeof FolderTree; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  params: Record<string, string | string[] | undefined>;
}) {
  const href = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key !== "page" && typeof value === "string" && value) query.set(key, value);
    }
    if (target > 1) query.set("page", String(target));
    return query.size ? `/office/categories?${query}` : "/office/categories";
  };
  return (
    <nav aria-label="Category pagination" className="flex items-center justify-between gap-3 text-sm text-slate-600">
      <p>{total} categor{total === 1 ? "y" : "ies"}</p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Link href={href(page - 1)} aria-disabled={page <= 1} className={buttonVariants("outline", "sm", page <= 1 ? "pointer-events-none opacity-50" : "")}>Previous</Link>
          <span>Page {page} of {totalPages}</span>
          <Link href={href(page + 1)} aria-disabled={page >= totalPages} className={buttonVariants("outline", "sm", page >= totalPages ? "pointer-events-none opacity-50" : "")}>Next</Link>
        </div>
      ) : null}
    </nav>
  );
}

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function positiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function enumValue<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
