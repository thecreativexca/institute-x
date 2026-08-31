"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { createCourseAction, updateCourseAction } from "@/lib/office/courses/actions";
import { slugify } from "@/lib/office/courses/validation";
import type { CourseFormValues, CategoryOption } from "@/lib/office/courses/dto";
import type { CourseLevel } from "@/lib/constants";
import type { LearningMode } from "@/models/Course";

const LEVEL_OPTIONS: { value: CourseLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all_levels", label: "All levels" },
];

const MODE_OPTIONS: { value: LearningMode; label: string }[] = [
  { value: "online", label: "Online" },
  { value: "hybrid", label: "Hybrid" },
  { value: "offline", label: "Offline" },
];

export const emptyCourseFormValues: CourseFormValues = {
  name: "",
  slug: "",
  categoryId: "",
  shortDescription: "",
  description: "",
  level: "beginner",
  learningMode: "online",
  durationWeeks: "",
  isFree: false,
  isPurchasable: true,
  price: "",
  compareAtPrice: "",
  instructorName: "",
  tags: "",
  learningOutcomes: "",
  requirements: "",
  targetAudience: "",
  faqs: [],
  seoTitle: "",
  seoDescription: "",
};

interface CourseFormProps {
  mode: "create" | "edit";
  courseId?: string;
  categories: CategoryOption[];
  initial?: CourseFormValues;
  canSubmit: boolean;
}

/**
 * Course create/edit form (req. 11, 87–89). Server-side validation is
 * authoritative — client validation is UX only. Explicit Save (no autosave);
 * warns on unsaved changes before leaving the page (req. 88).
 */
export function CourseForm({ mode, courseId, categories, initial, canSubmit }: CourseFormProps) {
  const action =
    mode === "create" ? createCourseAction : updateCourseAction.bind(null, courseId ?? "");
  const [state, formAction, isPending] = useActionState(action, { ok: false });

  const [values, setValues] = useState<CourseFormValues>(initial ?? emptyCourseFormValues);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [savedSnapshot] = useState(() => JSON.stringify(initial ?? emptyCourseFormValues));

  const isDirty = useMemo(
    () => JSON.stringify(values) !== savedSnapshot,
    [values, savedSnapshot]
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function set<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleNameChange(name: string) {
    setValues((prev) => ({
      ...prev,
      name,
      // Auto-generate slug from title until manually edited (req. 13). A
      // published course's slug never changes silently — only when the user
      // edits the slug field here (server warns on the URL change).
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  }

  const fieldError = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="tags" value={JSON.stringify(values.tags.split(",").map((t) => t.trim()).filter(Boolean))} />
      <input type="hidden" name="learningOutcomes" value={JSON.stringify(values.learningOutcomes.split("\n").map((t) => t.trim()).filter(Boolean))} />
      <input type="hidden" name="requirements" value={JSON.stringify(values.requirements.split("\n").map((t) => t.trim()).filter(Boolean))} />
      <input type="hidden" name="targetAudience" value={JSON.stringify(values.targetAudience.split("\n").map((t) => t.trim()).filter(Boolean))} />
      <input type="hidden" name="faqs" value={JSON.stringify(values.faqs)} />

      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell label="Course name" id="name" error={fieldError("name")}>
            <input
              id="name"
              name="name"
              value={values.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={controlClassName(!!fieldError("name"))}
              maxLength={150}
              required
            />
          </FieldShell>

          <FieldShell
            label="URL slug"
            id="slug"
            error={fieldError("slug")}
            hint="Lowercase letters, numbers and hyphens. Must be unique."
          >
            <input
              id="slug"
              name="slug"
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value.toLowerCase());
              }}
              className={controlClassName(!!fieldError("slug"))}
              maxLength={120}
            />
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell label="Category" id="categoryId" error={fieldError("categoryId")}>
              <select
                id="categoryId"
                name="categoryId"
                value={values.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={controlClassName(!!fieldError("categoryId"))}
                required
              >
                <option value="">Select a category…</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell label="Level" id="level">
              <select
                id="level"
                name="level"
                value={values.level}
                onChange={(e) => set("level", e.target.value as CourseLevel)}
                className={controlClassName(false)}
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldShell>
          </div>

          <FieldShell
            label="Short description"
            id="shortDescription"
            optionalLabel="shown on course cards"
            error={fieldError("shortDescription")}
          >
            <textarea
              id="shortDescription"
              name="shortDescription"
              value={values.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              className={controlClassName(false, "min-h-20")}
              maxLength={300}
            />
          </FieldShell>

          <FieldShell label="Full description" id="description" error={fieldError("description")}>
            <textarea
              id="description"
              name="description"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={controlClassName(false, "min-h-40")}
            />
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldShell label="Duration (weeks)" id="durationWeeks" optionalLabel="optional">
              <input
                id="durationWeeks"
                name="durationWeeks"
                type="number"
                min={1}
                max={104}
                value={values.durationWeeks}
                onChange={(e) => set("durationWeeks", e.target.value)}
                className={controlClassName(false)}
              />
            </FieldShell>

            <FieldShell label="Learning mode" id="learningMode">
              <select
                id="learningMode"
                name="learningMode"
                value={values.learningMode}
                onChange={(e) => set("learningMode", e.target.value as LearningMode)}
                className={controlClassName(false)}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FieldShell>

            <FieldShell label="Instructor name" id="instructorName" optionalLabel="optional">
              <input
                id="instructorName"
                name="instructorName"
                value={values.instructorName}
                onChange={(e) => set("instructorName", e.target.value)}
                className={controlClassName(false)}
                maxLength={120}
              />
            </FieldShell>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name="isFree"
                checked={values.isFree}
                onChange={(e) => set("isFree", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600/40"
              />
              This course is free
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                name="isPurchasable"
                checked={values.isPurchasable}
                onChange={(e) => set("isPurchasable", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600/40"
              />
              Purchasable / enrollable
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FieldShell
              label="Price (INR)"
              id="price"
              error={fieldError("price")}
              hint={values.isFree ? "Free courses ignore price" : undefined}
            >
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step={0.01}
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                className={controlClassName(!!fieldError("price"))}
                disabled={values.isFree}
              />
            </FieldShell>

            <FieldShell label="Compare-at price (INR)" id="compareAtPrice" optionalLabel="optional">
              <input
                id="compareAtPrice"
                name="compareAtPrice"
                type="number"
                min={0}
                step={0.01}
                value={values.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                className={controlClassName(false)}
                disabled={values.isFree}
              />
            </FieldShell>
          </div>
          <p className="text-xs text-slate-500">
            Price changes affect only future orders — existing payment records keep their original amount snapshot.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell label="Tags" id="tags" hint="Comma-separated, max 15 tags" error={fieldError("tags")}>
            <input
              id="tags"
              value={values.tags}
              onChange={(e) => set("tags", e.target.value)}
              className={controlClassName(false)}
              placeholder="typing, ms-excel, communication"
            />
          </FieldShell>

          <FieldShell label="Learning outcomes" id="learningOutcomes" hint="One per line">
            <textarea
              id="learningOutcomes"
              value={values.learningOutcomes}
              onChange={(e) => set("learningOutcomes", e.target.value)}
              className={controlClassName(false, "min-h-28")}
            />
          </FieldShell>

          <FieldShell label="Requirements" id="requirements" hint="One per line">
            <textarea
              id="requirements"
              value={values.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              className={controlClassName(false, "min-h-24")}
            />
          </FieldShell>

          <FieldShell label="Target audience" id="targetAudience" hint="One per line">
            <textarea
              id="targetAudience"
              value={values.targetAudience}
              onChange={(e) => set("targetAudience", e.target.value)}
              className={controlClassName(false, "min-h-24")}
            />
          </FieldShell>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-slate-800">FAQs</legend>
            {values.faqs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">FAQ {index + 1}</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={faq.enabled}
                        onChange={(e) => {
                          const next = [...values.faqs];
                          next[index] = { ...faq, enabled: e.target.checked };
                          set("faqs", next);
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
                      />
                      Enabled
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-700 hover:underline"
                      onClick={() => set("faqs", values.faqs.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <input
                  aria-label={`FAQ ${index + 1} question`}
                  value={faq.question}
                  onChange={(e) => {
                    const next = [...values.faqs];
                    next[index] = { ...faq, question: e.target.value };
                    set("faqs", next);
                  }}
                  placeholder="Question"
                  className={controlClassName(false, "mt-2")}
                  maxLength={300}
                />
                <textarea
                  aria-label={`FAQ ${index + 1} answer`}
                  value={faq.answer}
                  onChange={(e) => {
                    const next = [...values.faqs];
                    next[index] = { ...faq, answer: e.target.value };
                    set("faqs", next);
                  }}
                  placeholder="Answer"
                  className={controlClassName(false, "mt-2 min-h-20")}
                  maxLength={2000}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => set("faqs", [...values.faqs, { question: "", answer: "", enabled: true }])}
            >
              Add FAQ
            </Button>
          </fieldset>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>SEO (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldShell label="SEO title" id="seoTitle" optionalLabel="falls back to course name">
            <input
              id="seoTitle"
              name="seoTitle"
              value={values.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              className={controlClassName(false)}
              maxLength={200}
            />
          </FieldShell>
          <FieldShell label="SEO description" id="seoDescription" optionalLabel="falls back to short description">
            <textarea
              id="seoDescription"
              name="seoDescription"
              value={values.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              className={controlClassName(false, "min-h-20")}
              maxLength={300}
            />
          </FieldShell>
        </CardContent>
      </Card>

      {state.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        <Link
          href={mode === "edit" && courseId ? `/office/courses/${courseId}` : "/office/courses"}
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cancel
        </Link>
        <Button type="submit" isLoading={isPending} disabled={!canSubmit}>
          {mode === "create" ? "Create course" : "Save changes"}
        </Button>
      </div>

      {isDirty ? (
        <p className="text-right text-xs text-slate-400" aria-live="polite">
          You have unsaved changes.
        </p>
      ) : null}
    </form>
  );
}

