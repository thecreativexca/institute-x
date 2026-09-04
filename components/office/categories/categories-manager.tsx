"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Edit3, FolderTree, Plus, Power, PowerOff, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  createCategoryAdminAction,
  deleteCategoryAction,
  setCategoryStatusAction,
  updateCategoryAction,
} from "@/lib/office/categories/actions";
import type {
  CategoryActionResult,
  CategoryFormInput,
  CategoryListItem,
} from "@/lib/office/categories/dto";

const EMPTY_FORM: Required<CategoryFormInput> = {
  name: "",
  slug: "",
  description: "",
  thumbnailUrl: "",
  isActive: true,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
};

export function CategoriesManager({ categories }: { categories: CategoryListItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<CategoryListItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<CategoryListItem | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function finish(result: CategoryActionResult, onSuccess?: () => void) {
    if (result.ok) {
      setNotice({ ok: true, text: result.message ?? "Saved." });
      setFieldErrors({});
      onSuccess?.();
      router.refresh();
      return;
    }
    setNotice({ ok: false, text: result.error ?? "Please review the highlighted fields." });
    setFieldErrors(result.fieldErrors ?? {});
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          className="rounded-xl"
          onClick={() => {
            setNotice(null);
            setFieldErrors({});
            setEditing("new");
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> New category
        </Button>
      </div>

      {notice ? (
        <div
          role={notice.ok ? "status" : "alert"}
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      {categories.length === 0 ? (
        <EmptyState
          title="No categories found"
          description="Create a category or clear the current filters."
          icon={<FolderTree className="h-10 w-10" />}
          action={
            <Button onClick={() => setEditing("new")}>
              <Plus className="h-4 w-4" /> Create category
            </Button>
          }
        />
      ) : (
        categories.map((category) => (
          <Card key={category.id} className="overflow-hidden border-slate-200/80">
            <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-50 text-primary-700">
                  {category.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={category.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <FolderTree className="h-6 w-6" aria-hidden="true" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-slate-900">{category.name}</h2>
                    <Badge variant={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">/{category.slug}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">
                    {category.description || "No description added yet."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:w-64">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-base font-semibold text-slate-900">{category.courseCount}</p>
                  <p className="text-xs text-slate-500">Courses</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-base font-semibold text-slate-900">{category.sortOrder}</p>
                  <p className="text-xs text-slate-500">Sort order</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotice(null);
                    setFieldErrors({});
                    setEditing(category);
                  }}
                >
                  <Edit3 className="h-4 w-4" aria-hidden="true" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () =>
                      finish(await setCategoryStatusAction(category.id, !category.isActive))
                    )
                  }
                >
                  {category.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  {category.isActive ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => {
                    setNotice(null);
                    setDeleting(category);
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {editing ? (
        <CategoryFormModal
          key={editing === "new" ? "new" : editing.id}
          category={editing}
          pending={isPending}
          fieldErrors={fieldErrors}
          onClose={() => !isPending && setEditing(null)}
          onSubmit={(input) =>
            startTransition(async () => {
              const result =
                editing === "new"
                  ? await createCategoryAdminAction(input)
                  : await updateCategoryAction(editing.id, input);
              finish(result, () => setEditing(null));
            })
          }
        />
      ) : null}

      <Modal
        open={Boolean(deleting)}
        onClose={() => !isPending && setDeleting(null)}
        title="Delete category?"
        description={
          deleting?.courseCount
            ? "This category is still connected to courses and cannot be deleted."
            : "This permanently removes the category. This action cannot be undone."
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={isPending}>Cancel</Button>
            <Button
              variant="danger"
              isLoading={isPending}
              disabled={!deleting || deleting.courseCount > 0}
              onClick={() =>
                deleting &&
                startTransition(async () =>
                  finish(await deleteCategoryAction(deleting.id), () => setDeleting(null))
                )
              }
            >
              Delete category
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          {deleting?.courseCount
            ? `Move ${deleting.courseCount} linked course${deleting.courseCount === 1 ? "" : "s"} to another category first.`
            : `“${deleting?.name ?? "This category"}” has no linked courses and is safe to delete.`}
        </p>
      </Modal>
    </div>
  );
}

function CategoryFormModal({
  category,
  pending,
  fieldErrors,
  onClose,
  onSubmit,
}: {
  category: CategoryListItem | "new";
  pending: boolean;
  fieldErrors: Record<string, string>;
  onClose: () => void;
  onSubmit: (input: CategoryFormInput) => void;
}) {
  const initial: Required<CategoryFormInput> =
    category !== "new"
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description,
          thumbnailUrl: category.thumbnailUrl ?? "",
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          seoTitle: category.seoTitle,
          seoDescription: category.seoDescription,
        }
      : EMPTY_FORM;
  const [form, setForm] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(category !== "new");

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Modal
      open={Boolean(category)}
      onClose={onClose}
      title={category === "new" ? "Create category" : "Edit category"}
      description="Organize the public catalog and course builder with a clear category."
      className="max-h-[90vh] max-w-2xl overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button isLoading={pending} onClick={() => onSubmit(form)}>
            {category === "new" ? "Create category" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell id="category-name" label="Name" required error={fieldErrors.name}>
          <input
            id="category-name"
            value={form.name}
            onChange={(event) => {
              const name = event.target.value;
              setForm((current) => ({
                ...current,
                name,
                slug: slugTouched ? current.slug : toSlug(name),
              }));
            }}
            className={controlClassName(Boolean(fieldErrors.name), "h-10")}
            maxLength={120}
          />
        </FieldShell>
        <FieldShell id="category-slug" label="Slug" required error={fieldErrors.slug}>
          <input
            id="category-slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              update("slug", toSlug(event.target.value));
            }}
            className={controlClassName(Boolean(fieldErrors.slug), "h-10")}
            maxLength={100}
          />
        </FieldShell>
        <div className="sm:col-span-2">
          <FieldShell id="category-description" label="Description" error={fieldErrors.description}>
            <textarea
              id="category-description"
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              className={controlClassName(Boolean(fieldErrors.description), "min-h-24 py-2")}
              maxLength={500}
            />
          </FieldShell>
        </div>
        <FieldShell id="category-image" label="Thumbnail URL" optionalLabel="optional" error={fieldErrors.thumbnailUrl}>
          <input
            id="category-image"
            value={form.thumbnailUrl}
            onChange={(event) => update("thumbnailUrl", event.target.value)}
            className={controlClassName(Boolean(fieldErrors.thumbnailUrl), "h-10")}
            placeholder="https://…"
          />
        </FieldShell>
        <FieldShell id="category-order" label="Sort order" error={fieldErrors.sortOrder}>
          <input
            id="category-order"
            type="number"
            min={0}
            max={9999}
            value={form.sortOrder}
            onChange={(event) => update("sortOrder", Number(event.target.value))}
            className={controlClassName(Boolean(fieldErrors.sortOrder), "h-10")}
          />
        </FieldShell>
        <FieldShell id="category-seo-title" label="SEO title" optionalLabel="optional" error={fieldErrors.seoTitle}>
          <input
            id="category-seo-title"
            value={form.seoTitle}
            onChange={(event) => update("seoTitle", event.target.value)}
            className={controlClassName(Boolean(fieldErrors.seoTitle), "h-10")}
            maxLength={200}
          />
        </FieldShell>
        <FieldShell id="category-seo-description" label="SEO description" optionalLabel="optional" error={fieldErrors.seoDescription}>
          <input
            id="category-seo-description"
            value={form.seoDescription}
            onChange={(event) => update("seoDescription", event.target.value)}
            className={controlClassName(Boolean(fieldErrors.seoDescription), "h-10")}
            maxLength={300}
          />
        </FieldShell>
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
            className="h-4 w-4 accent-primary-600"
          />
          Active and available in the course catalog
        </label>
      </div>
    </Modal>
  );
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
