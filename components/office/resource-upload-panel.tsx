"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldShell, controlClassName } from "@/components/ui/field";

interface CatalogItem {
  id: string;
  name: string;
}

interface ResourceUploadPanelProps {
  maxSizeMB: number;
  allowedExtensions: string[];
}

type CatalogState = {
  courses: CatalogItem[];
  modules: CatalogItem[];
  lessons: CatalogItem[];
};

const initialCatalog: CatalogState = { courses: [], modules: [], lessons: [] };

/**
 * Office-side resource upload panel (Phase 8 foundation). Collects placement
 * (course → module → lesson), meta details and a file, and posts multipart
 * form data to /api/office/resources. Authorization is re-verified on the
 * server; the browser never talks to Cloudinary directly.
 */
export function ResourceUploadPanel({ maxSizeMB, allowedExtensions }: ResourceUploadPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [catalog, setCatalog] = useState<CatalogState>(initialCatalog);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [access, setAccess] = useState("view_and_download");
  const [isPublished, setIsPublished] = useState(false);
  const [order, setOrder] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadCatalog(type: "courses" | "modules" | "lessons", parentId?: string) {
    const params = new URLSearchParams({ type });
    if (parentId) params.set(type === "modules" ? "courseId" : "moduleId", parentId);
    const response = await fetch(`/api/office/resources/catalog?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error ?? "Unable to load options.");
    }
    return payload.items as CatalogItem[];
  }

  async function handleCourseChange(value: string) {
    setCourseId(value);
    setModuleId("");
    setLessonId("");
    setCatalog((prev) => ({ ...prev, modules: [], lessons: [] }));
    if (!value) return;
    try {
      const modules = await loadCatalog("modules", value);
      setCatalog((prev) => ({ ...prev, modules }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load modules.");
    }
  }

  async function handleModuleChange(value: string) {
    setModuleId(value);
    setLessonId("");
    setCatalog((prev) => ({ ...prev, lessons: [] }));
    if (!value) return;
    try {
      const lessons = await loadCatalog("lessons", value);
      setCatalog((prev) => ({ ...prev, lessons }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load lessons.");
    }
  }

  async function loadCourses() {
    try {
      const courses = await loadCatalog("courses");
      setCatalog((prev) => ({ ...prev, courses }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load courses.");
    }
  }

  function handleFileChange(nextFile: File | null) {
    setFile(nextFile);
    setError("");
    if (nextFile && !title) {
      const base = nextFile.name.replace(/\.[^.]+$/, "");
      if (base) setTitle(base.slice(0, 200));
    }
  }

  function validateBeforeSubmit(): string | null {
    if (!file) return "Please choose a file to upload.";
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `Files must be ${maxSizeMB} MB or smaller.`;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!allowedExtensions.includes(extension)) {
      return `Only ${allowedExtensions.join(", ").toUpperCase()} files are allowed.`;
    }
    if (!courseId || !moduleId || !lessonId) return "Select a course, module and lesson.";
    if (!title.trim()) return "Enter a resource title.";
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return;

    const validationError = validateBeforeSubmit();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.set("file", file as File);
      formData.set("courseId", courseId);
      formData.set("moduleId", moduleId);
      formData.set("lessonId", lessonId);
      formData.set("title", title.trim());
      if (description.trim()) formData.set("description", description.trim());
      formData.set("access", access);
      formData.set("isPublished", isPublished ? "true" : "false");
      formData.set("order", order);

      const response = await fetch("/api/office/resources", { method: "POST", body: formData });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        setError(payload?.error ?? "Upload failed. Please try again.");
        setIsUploading(false);
        return;
      }

      setSuccess("Resource uploaded successfully.");
      setFile(null);
      setTitle("");
      setDescription("");
      setIsPublished(false);
      setOrder("0");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
      router.refresh();
    } catch {
      setError("Upload failed. Please check your connection and try again.");
      setIsUploading(false);
    }
  }

  const selectControl = (value: string, hasError: boolean) =>
    controlClassName(hasError, "h-10 pr-8 disabled:opacity-60");

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-card">
      <CardHeader className="border-b border-slate-100 bg-slate-50/70">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary-600" aria-hidden="true" />
          Upload learning resource
        </CardTitle>
        <CardDescription>
          PDF, DOC, DOCX or TXT up to {maxSizeMB} MB. Files are stored securely and attached to a
          course lesson.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5" onFocus={loadCourses}>
              <label htmlFor="upload-course" className="text-sm font-medium text-slate-800">
                Course
              </label>
              <select
                id="upload-course"
                value={courseId}
                onChange={(event) => void handleCourseChange(event.target.value)}
                className={selectControl(courseId, false)}
                required
              >
                <option value="">Select course…</option>
                {catalog.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="upload-module" className="text-sm font-medium text-slate-800">
                Module
              </label>
              <select
                id="upload-module"
                value={moduleId}
                onChange={(event) => void handleModuleChange(event.target.value)}
                className={selectControl(moduleId, false)}
                disabled={!courseId}
                required
              >
                <option value="">Select module…</option>
                {catalog.modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="upload-lesson" className="text-sm font-medium text-slate-800">
                Lesson
              </label>
              <select
                id="upload-lesson"
                value={lessonId}
                onChange={(event) => setLessonId(event.target.value)}
                className={selectControl(lessonId, false)}
                disabled={!moduleId}
                required
              >
                <option value="">Select lesson…</option>
                {catalog.lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FieldShell label="Title" id="upload-title">
            <input
              id="upload-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={controlClassName(false)}
              maxLength={200}
              required
            />
          </FieldShell>

          <FieldShell label="Description" id="upload-description" optionalLabel="optional">
            <textarea
              id="upload-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className={controlClassName(false, "min-h-20")}
              maxLength={1000}
            />
          </FieldShell>

          <div className="grid gap-4 sm:grid-cols-3">
            <FieldShell label="Access" id="upload-access">
              <select
                id="upload-access"
                value={access}
                onChange={(event) => setAccess(event.target.value)}
                className={controlClassName(false, "h-10 pr-8")}
              >
                <option value="view_and_download">View &amp; download</option>
                <option value="view_only">View only</option>
                <option value="private">Private</option>
              </select>
            </FieldShell>

            <FieldShell label="Sort order" id="upload-order">
              <input
                id="upload-order"
                type="number"
                min={0}
                max={999}
                value={order}
                onChange={(event) => setOrder(event.target.value)}
                className={controlClassName(false)}
              />
            </FieldShell>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(event) => setIsPublished(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600/40"
                />
                Publish immediately
              </label>
            </div>
          </div>

          <FieldShell
            label="File"
            id="upload-file"
            hint={`Allowed: ${allowedExtensions.join(", ").toUpperCase()} · Max ${maxSizeMB} MB`}
          >
            <input
              id="upload-file"
              ref={fileInputRef}
              type="file"
              accept={allowedExtensions.map((extension) => `.${extension}`).join(",")}
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800 hover:file:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-600/40"
              required
            />
          </FieldShell>

          {error ? (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" isLoading={isUploading} className="rounded-xl shadow-sm">
              {isUploading ? "Uploading…" : "Upload resource"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

