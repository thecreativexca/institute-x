"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { FieldShell, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { ContentStatusBadge } from "./course-status-badge";
import {
  createModuleAction,
  updateModuleAction,
  deleteModuleAction,
  reorderModulesAction,
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  moveLessonToModuleAction,
  reorderResourcesAction,
  type ActionState,
} from "@/lib/office/courses/actions";
import type {
  CurriculumData,
  CurriculumModuleDTO,
  CurriculumLessonDTO,
} from "@/lib/office/courses/dto";
import { buildYouTubeEmbedUrl, parseYouTubeVideoId } from "@/lib/office/courses/youtube";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface CurriculumManagerProps {
  curriculum: CurriculumData;
  canManageModules: boolean;
  canManageLessons: boolean;
  canManageResources: boolean;
  maxResourceSizeMB: number;
}

/**
 * Curriculum manager (req. 31â€“53, 91â€“92): modules with nested lessons and
 * resources. Reordering uses keyboard-accessible Move Up/Down controls; the
 * new order is persisted server-side (optimistic UI rolls back on failure).
 */
export function CurriculumManager({
  curriculum,
  canManageModules,
  canManageLessons,
  canManageResources,
  maxResourceSizeMB,
}: CurriculumManagerProps) {
  const router = useRouter();
  const [modules, setModules] = useState<CurriculumModuleDTO[]>(curriculum.modules);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isPending, startTransition] = useTransition();

  const courseId = curriculum.course.id;

  const [moduleModal, setModuleModal] = useState<
    { mode: "create" } | { mode: "edit"; module: CurriculumModuleDTO } | null
  >(null);
  const [lessonModal, setLessonModal] = useState<
    { moduleId: string } | { moduleId: string; lesson: CurriculumLessonDTO } | null
  >(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [moveLessonTarget, setMoveLessonTarget] = useState<string | null>(null);

  function runMutation(action: () => Promise<ActionState>, onDone?: () => void) {
    setError("");
    setStatus("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Action failed.");
        return;
      }
      if (result.message) setStatus(result.message);
      onDone?.();
      router.refresh();
    });
  }

  function moveModule(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const previous = modules;
    const next = [...modules];
    [next[index], next[target]] = [next[target], next[index]];
    setModules(next);
    startTransition(async () => {
      const result = await reorderModulesAction(
        courseId,
        next.map((m) => m.id)
      );
      if (!result.ok) {
        setModules(previous); // optimistic rollback (req. 90)
        setError(result.error ?? "Reorder failed.");
      } else {
        router.refresh();
      }
    });
  }

  function moveLesson(moduleIndex: number, lessonIndex: number, direction: -1 | 1) {
    const moduleDoc = modules[moduleIndex];
    const target = lessonIndex + direction;
    if (target < 0 || target >= moduleDoc.lessons.length) return;
    const previous = modules;
    const next = modules.map((m) => ({ ...m, lessons: [...m.lessons] }));
    const lessons = next[moduleIndex].lessons;
    [lessons[lessonIndex], lessons[target]] = [lessons[target], lessons[lessonIndex]];
    setModules(next);
    startTransition(async () => {
      const result = await reorderLessonsAction(
        courseId,
        moduleDoc.id,
        lessons.map((l) => l.id)
      );
      if (!result.ok) {
        setModules(previous);
        setError(result.error ?? "Reorder failed.");
      } else {
        router.refresh();
      }
    });
  }

  function moveResource(lesson: CurriculumLessonDTO, resourceIndex: number, direction: -1 | 1) {
    const target = resourceIndex + direction;
    if (target < 0 || target >= lesson.resources.length) return;
    const orderedIds = lesson.resources.map((r) => r.id);
    [orderedIds[resourceIndex], orderedIds[target]] = [orderedIds[target], orderedIds[resourceIndex]];
    startTransition(async () => {
      const result = await reorderResourcesAction(courseId, lesson.id, orderedIds);
      if (!result.ok) setError(result.error ?? "Reorder failed.");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600" aria-live="polite">
          <span>
            <strong>{curriculum.counts.modules}</strong> modules
          </span>
          <span>
            <strong>{curriculum.counts.publishedLessons}</strong> / {curriculum.counts.lessons} lessons
            published
          </span>
          <span>
            <strong>{curriculum.counts.draftLessons}</strong> draft lessons
          </span>
          <span>
            <strong>{curriculum.counts.resources}</strong> resources
          </span>
        </div>
        {canManageModules ? (
          <Button onClick={() => setModuleModal({ mode: "create" })}>Add module</Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {status ? (
        <p role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {status}
        </p>
      ) : null}

      {modules.length === 0 ? (
        <EmptyState
          title="No modules yet"
          description="Start building this course by adding its first module."
          action={
            canManageModules ? (
              <Button onClick={() => setModuleModal({ mode: "create" })}>Add module</Button>
            ) : undefined
          }
        />
      ) : (
        <ol className="space-y-4" aria-label="Course curriculum">
          {modules.map((moduleDoc, moduleIndex) => (
            <li key={moduleDoc.id}>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      <span className="text-slate-400">Module {moduleIndex + 1}</span>
                      {moduleDoc.title}
                      <ContentStatusBadge published={moduleDoc.isPublished} />
                    </CardTitle>
                    {moduleDoc.description ? (
                      <p className="mt-1 text-sm text-slate-500">{moduleDoc.description}</p>
                    ) : null}
                  </div>
                  {canManageModules ? (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveModule(moduleIndex, -1)}
                        disabled={moduleIndex === 0 || isPending}
                        aria-label={`Move module ${moduleIndex + 1} up`}
                      >
                        â†‘ Up
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveModule(moduleIndex, 1)}
                        disabled={moduleIndex === modules.length - 1 || isPending}
                        aria-label={`Move module ${moduleIndex + 1} down`}
                      >
                        â†“ Down
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setModuleModal({ mode: "edit", module: moduleDoc })}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Delete module "${moduleDoc.title}"?`)) {
                            runMutation(() => deleteModuleAction(courseId, moduleDoc.id));
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent>
                  {canManageLessons ? (
                    <div className="mb-3">
                      <Button size="sm" variant="secondary" onClick={() => setLessonModal({ moduleId: moduleDoc.id })}>
                        + Add lesson
                      </Button>
                    </div>
                  ) : null}

                  {moduleDoc.lessons.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      This module has no lessons yet.
                    </p>
                  ) : (
                    <ul className="space-y-2" aria-label={`Lessons in ${moduleDoc.title}`}>
                      {moduleDoc.lessons.map((lesson, lessonIndex) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          lessonIndex={lessonIndex}
                          moduleId={moduleDoc.id}
                          courseId={courseId}
                          modules={modules}
                          canManageLessons={canManageLessons}
                          canManageResources={canManageResources}
                          maxResourceSizeMB={maxResourceSizeMB}
                          expanded={expandedLesson === lesson.id}
                          onToggle={() =>
                            setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)
                          }
                          onMoveLesson={(direction) => moveLesson(moduleIndex, lessonIndex, direction)}
                          onMoveResource={(resourceIndex, direction) =>
                            moveResource(lesson, resourceIndex, direction)
                          }
                          onEditLesson={() => setLessonModal({ moduleId: moduleDoc.id, lesson })}
                          onDeleteLesson={() => {
                            if (window.confirm(`Delete lesson "${lesson.title}"?`)) {
                              runMutation(() => deleteLessonAction(courseId, lesson.id));
                            }
                          }}
                          onTogglePublish={() =>
                            runMutation(() =>
                              updateLessonAction(courseId, lesson.id, {
                                isPublished: !lesson.isPublished,
                              })
                            )
                          }
                          onMoveToModule={(targetModuleId) =>
                            runMutation(
                              () => moveLessonToModuleAction(courseId, lesson.id, targetModuleId),
                              () => setMoveLessonTarget(null)
                            )
                          }
                          moveTargetOpen={moveLessonTarget === lesson.id}
                          onOpenMoveTarget={() => setMoveLessonTarget(lesson.id)}
                          onCloseMoveTarget={() => setMoveLessonTarget(null)}
                          onResourceChanged={() => router.refresh()}
                        />
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {/* Module create/edit modal */}
      <ModuleModal
        state={moduleModal}
        isPending={isPending}
        onClose={() => setModuleModal(null)}
        onSubmit={(formData, existing) => {
          if (existing) {
            runMutation(
              () =>
                updateModuleAction(courseId, existing.id, {
                  title: formData.title,
                  description: formData.description,
                  isPublished: formData.isPublished,
                }),
              () => setModuleModal(null)
            );
          } else {
            const fd = new FormData();
            fd.set("title", formData.title);
            fd.set("description", formData.description);
            fd.set("isPublished", String(formData.isPublished));
            startTransition(async () => {
              const result = await createModuleAction(courseId, { ok: false }, fd);
              if (!result.ok) {
                setError(result.error ?? result.fieldErrors?.title ?? "Could not create moduleDoc.");
                return;
              }
              setModuleModal(null);
              setStatus("Module created.");
              router.refresh();
            });
          }
        }}
      />

      {/* Lesson create/edit modal */}
      <LessonModal
        state={lessonModal}
        isPending={isPending}
        onClose={() => setLessonModal(null)}
        onSubmit={(formData) => {
          if (!lessonModal) return;
          const existingLesson = "lesson" in lessonModal ? lessonModal.lesson : null;
          if (existingLesson) {
            runMutation(
              () => updateLessonAction(courseId, existingLesson.id, formData),
              () => setLessonModal(null)
            );
          } else {
            const fd = new FormData();
            fd.set("title", formData.title ?? "");
            fd.set("description", formData.description ?? "");
            fd.set("youtubeUrl", formData.youtubeUrl ?? "");
            if (formData.durationMinutes !== undefined)
              fd.set("durationMinutes", String(formData.durationMinutes));
            fd.set("isPreview", String(!!formData.isPreview));
            fd.set("isPublished", String(!!formData.isPublished));
            startTransition(async () => {
              const result = await createLessonAction(
                courseId,
                lessonModal.moduleId,
                { ok: false },
                fd
              );
              if (!result.ok) {
                setError(result.error ?? result.fieldErrors?.title ?? "Could not create lesson.");
                return;
              }
              setLessonModal(null);
              setStatus("Lesson created.");
              router.refresh();
            });
          }
        }}
      />
    </div>
  );
}


/* ------------------------------ Module modal ------------------------------ */

interface ModuleModalState {
  mode: "create" | "edit";
  module?: CurriculumModuleDTO;
}

function ModuleModal({
  state,
  isPending,
  onClose,
  onSubmit,
}: {
  state: ModuleModalState | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (
    data: { title: string; description: string; isPublished: boolean },
    existing?: CurriculumModuleDTO
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [key, setKey] = useState("");

  // Reset fields whenever the modal target changes.
  const stateKey = state ? `${state.mode}-${"module" in state ? state.module?.id ?? "new" : "new"}` : "";
  if (stateKey !== key) {
    setKey(stateKey);
    setTitle(state?.mode === "edit" && state.module ? state.module.title : "");
    setDescription(state?.mode === "edit" && state.module ? state.module.description : "");
    setIsPublished(state?.mode === "edit" && state.module ? state.module.isPublished : false);
    setTitleError("");
  }

  function submit() {
    if (!title.trim()) {
      setTitleError("Title is required.");
      return;
    }
    onSubmit({ title: title.trim(), description: description.trim(), isPublished }, state?.module);
  }

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={state?.mode === "edit" ? "Edit moduleDoc" : "Add module"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isPending}>
            {state?.mode === "edit" ? "Save moduleDoc" : "Create moduleDoc"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldShell label="Title" id="module-title" error={titleError}>
          <input
            id="module-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={controlClassName(!!titleError)}
            maxLength={150}
          />
        </FieldShell>
        <FieldShell label="Description" id="module-description" optionalLabel="optional">
          <textarea
            id="module-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={controlClassName(false, "min-h-20")}
            maxLength={500}
          />
        </FieldShell>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600"
          />
          Published (visible to enrolled students)
        </label>
      </div>
    </Modal>
  );
}


/* ------------------------------ Lesson modal ------------------------------ */

type LessonModalState =
  | { moduleId: string }
  | { moduleId: string; lesson: CurriculumLessonDTO }
  | null;

interface LessonFormData {
  title?: string;
  description?: string;
  youtubeUrl?: string;
  durationMinutes?: number;
  isPreview?: boolean;
  isPublished?: boolean;
}

function LessonModal({
  state,
  isPending,
  onClose,
  onSubmit,
}: {
  state: LessonModalState;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (data: LessonFormData) => void;
}) {
  const existing = state && "lesson" in state ? state.lesson : null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(existing?.videoUrl ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    existing?.durationMinutes != null ? String(existing.durationMinutes) : ""
  );
  const [isPreview, setIsPreview] = useState(existing?.isPreview ?? false);
  const [isPublished, setIsPublished] = useState(existing?.isPublished ?? false);
  const [titleError, setTitleError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [key, setKey] = useState("");

  const stateKey = state ? `${"lesson" in state ? state.lesson.id : "new"}-${state.moduleId}` : "";
  if (stateKey !== key) {
    setKey(stateKey);
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setYoutubeUrl(existing?.videoUrl ?? "");
    setDurationMinutes(existing?.durationMinutes != null ? String(existing.durationMinutes) : "");
    setIsPreview(existing?.isPreview ?? false);
    setIsPublished(existing?.isPublished ?? false);
    setTitleError("");
    setUrlError("");
  }

  const videoId = parseYouTubeVideoId(youtubeUrl);

  function submit() {
    let valid = true;
    if (!title.trim()) {
      setTitleError("Title is required.");
      valid = false;
    } else {
      setTitleError("");
    }
    if (youtubeUrl.trim() && !videoId) {
      setUrlError("Enter a valid YouTube URL (youtube.com/watch, youtu.be or embed).");
      valid = false;
    } else {
      setUrlError("");
    }
    if (!valid) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
      isPreview,
      isPublished,
    });
  }

  return (
    <Modal
      open={state !== null}
      onClose={onClose}
      title={existing ? "Edit lesson" : "Add lesson"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isPending}>
            {existing ? "Save lesson" : "Create lesson"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <FieldShell label="Title" id="lesson-title" error={titleError}>
          <input
            id="lesson-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={controlClassName(!!titleError)}
            maxLength={200}
          />
        </FieldShell>

        <FieldShell label="YouTube URL" id="lesson-youtube" error={urlError} hint="Watch, share (youtu.be), embed or Shorts URLs are accepted.">
          <input
            id="lesson-youtube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className={controlClassName(!!urlError)}
            placeholder="https://www.youtube.com/watch?v=â€¦"
            maxLength={500}
          />
        </FieldShell>

        {videoId ? (
          <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-black">
            <iframe
              src={buildYouTubeEmbedUrl(videoId)}
              title="Lesson video preview"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : null}

        <FieldShell label="Description / content" id="lesson-description" optionalLabel="optional">
          <textarea
            id="lesson-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={controlClassName(false, "min-h-28")}
          />
        </FieldShell>

        <div className="grid gap-4 sm:grid-cols-3">
          <FieldShell label="Duration (minutes)" id="lesson-duration" optionalLabel="optional">
            <input
              id="lesson-duration"
              type="number"
              min={0}
              max={600}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className={controlClassName(false)}
            />
          </FieldShell>
          <label className="flex items-end gap-2 pb-1.5 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={isPreview}
              onChange={(e) => setIsPreview(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600"
            />
            Free preview
          </label>
          <label className="flex items-end gap-2 pb-1.5 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-primary-600"
            />
            Published
          </label>
        </div>
      </div>
    </Modal>
  );
}


/* ------------------------------- Lesson row ------------------------------- */

function LessonRow({
  lesson,
  lessonIndex,
  moduleId,
  courseId,
  modules,
  canManageLessons,
  canManageResources,
  maxResourceSizeMB,
  expanded,
  onToggle,
  onMoveLesson,
  onMoveResource,
  onEditLesson,
  onDeleteLesson,
  onTogglePublish,
  onMoveToModule,
  moveTargetOpen,
  onOpenMoveTarget,
  onCloseMoveTarget,
  onResourceChanged,
}: {
  lesson: CurriculumLessonDTO;
  lessonIndex: number;
  moduleId: string;
  courseId: string;
  modules: CurriculumModuleDTO[];
  canManageLessons: boolean;
  canManageResources: boolean;
  maxResourceSizeMB: number;
  expanded: boolean;
  onToggle: () => void;
  onMoveLesson: (direction: -1 | 1) => void;
  onMoveResource: (resourceIndex: number, direction: -1 | 1) => void;
  onEditLesson: () => void;
  onDeleteLesson: () => void;
  onTogglePublish: () => void;
  onMoveToModule: (targetModuleId: string) => void;
  moveTargetOpen: boolean;
  onOpenMoveTarget: () => void;
  onCloseMoveTarget: () => void;
  onResourceChanged: () => void;
}) {
  const [resourceError, setResourceError] = useState("");
  const [resourceStatus, setResourceStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  function callResourceApi(url: string, options: RequestInit, successMessage: string) {
    setResourceError("");
    setResourceStatus("");
    startTransition(async () => {
      try {
        const response = await fetch(url, options);
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          setResourceError(payload?.error ?? "The action failed.");
          return;
        }
        setResourceStatus(successMessage);
        onResourceChanged();
      } catch {
        setResourceError("The action failed. Please try again.");
      }
    });
  }

  function uploadResource(form: HTMLFormElement) {
    const data = new FormData(form);
    // Placement ids come from the trusted server-rendered context; the
    // upload API re-verifies Course→Module→Lesson server-side regardless.
    data.set("courseId", courseId);
    data.set("moduleId", moduleId);
    setIsUploading(true);
    setResourceError("");
    setResourceStatus("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/office/resources", {
          method: "POST",
          body: data,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          setResourceError(payload?.error ?? "The upload failed.");
        } else {
          setResourceStatus("Resource uploaded.");
          onResourceChanged();
        }
      } catch {
        setResourceError("The upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    });
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="text-xs text-slate-400">Lesson {lessonIndex + 1}</span>
          <span className="truncate text-sm font-medium text-slate-800">{lesson.title}</span>
          <ContentStatusBadge published={lesson.isPublished} />
          {lesson.isPreview ? (
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
              Preview
            </span>
          ) : null}
          {lesson.resourceCount > 0 ? (
            <span className="text-xs text-slate-500">
              {lesson.resourceCount} resource{lesson.resourceCount === 1 ? "" : "s"}
            </span>
          ) : null}
          <span aria-hidden="true" className="ml-auto text-xs text-slate-400">
            {expanded ? "▲" : "▼"}
          </span>
        </button>

        {canManageLessons ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onMoveLesson(-1)} aria-label={`Move lesson ${lessonIndex + 1} up`}>
              ↑
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onMoveLesson(1)} aria-label={`Move lesson ${lessonIndex + 1} down`}>
              ↓
            </Button>
            <Button size="sm" variant="outline" onClick={onEditLesson}>
              Edit
            </Button>
            <Button size="sm" variant="ghost" onClick={onTogglePublish}>
              {lesson.isPublished ? "Unpublish" : "Publish"}
            </Button>
            <Button size="sm" variant="ghost" onClick={moveTargetOpen ? onCloseMoveTarget : onOpenMoveTarget}>
              Move
            </Button>
            <Button size="sm" variant="ghost" onClick={onDeleteLesson}>
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {moveTargetOpen ? (
        <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
          <label htmlFor={`move-${lesson.id}`} className="text-xs font-medium text-slate-600">
            Move to moduleDoc
          </label>
          <select
            id={`move-${lesson.id}`}
            className={controlClassName(false, "mt-1 h-9 max-w-xs pr-8")}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) onMoveToModule(e.target.value);
            }}
          >
            <option value="">Choose a moduleDoc…</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {expanded ? (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3">
          {lesson.description ? (
            <p className="whitespace-pre-line text-sm text-slate-600">{lesson.description}</p>
          ) : null}
          {lesson.videoId ? (
            <div className="aspect-video w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-black">
              <iframe
                src={buildYouTubeEmbedUrl(lesson.videoId)}
                title={`${lesson.title} video preview`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-500">No video added.</p>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-800">Resources</h4>

            {resourceError ? (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                {resourceError}
              </p>
            ) : null}
            {resourceStatus ? (
              <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                {resourceStatus}
              </p>
            ) : null}

            {lesson.resources.length === 0 ? (
              <p className="text-sm text-slate-500">No learning resources added.</p>
            ) : (
              <ul className="space-y-2">
                {lesson.resources.map((resource, resourceIndex) => (
                  <li
                    key={resource.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{resource.title}</p>
                      <p className="text-xs text-slate-500">
                        {resource.originalFileName} · {formatBytes(resource.fileSize)} ·{" "}
                        {resource.access === "view_and_download"
                          ? "View & download"
                          : resource.access === "view_only"
                            ? "View only"
                            : "Private"}
                        {resource.isPublished ? " · Published" : " · Draft"}
                      </p>
                    </div>
                    {canManageResources ? (
                      <div className="flex flex-wrap items-center gap-1">
                        <a
                          href={resource.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Preview file
                        </a>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onMoveResource(resourceIndex, -1)}
                          disabled={resourceIndex === 0 || pending}
                          aria-label={`Move resource ${resource.title} up`}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onMoveResource(resourceIndex, 1)}
                          disabled={resourceIndex === lesson.resources.length - 1 || pending}
                          aria-label={`Move resource ${resource.title} down`}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            callResourceApi(
                              `/api/office/resources/${resource.id}`,
                              {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ isPublished: !resource.isPublished }),
                              },
                              resource.isPublished ? "Resource unpublished." : "Resource published."
                            )
                          }
                        >
                          {resource.isPublished ? "Unpublish" : "Publish"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm(`Delete resource "${resource.title}"?`)) {
                              callResourceApi(
                                `/api/office/resources/${resource.id}`,
                                { method: "DELETE" },
                                "Resource deleted."
                              );
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

{canManageResources ? (
              <form
                className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  uploadResource(event.currentTarget);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <FieldShell label="Title" id={`res-title-${lesson.id}`}>
                    <input
                      id={`res-title-${lesson.id}`}
                      name="title"
                      className={controlClassName(false)}
                      maxLength={200}
                      required
                    />
                  </FieldShell>
                  <FieldShell label="Access" id={`res-access-${lesson.id}`}>
                    <select
                      id={`res-access-${lesson.id}`}
                      name="access"
                      className={controlClassName(false, "h-10 pr-8")}
                    >
                      <option value="view_and_download">View &amp; download</option>
                      <option value="view_only">View only</option>
                      <option value="private">Private</option>
                    </select>
                  </FieldShell>
                </div>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="moduleId" value={moduleId} />
                <input type="hidden" name="lessonId" value={lesson.id} />
                <input type="hidden" name="isPublished" value="true" />
                <input type="hidden" name="order" value="0" />
                <div className="mt-3">
                  <FieldShell
                    label="File"
                    id={`res-file-${lesson.id}`}
                    hint={`PDF, DOC, DOCX, TXT · max ${maxResourceSizeMB} MB`}
                  >
                    <input
                      id={`res-file-${lesson.id}`}
                      name="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      required
                      className="w-full cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-800"
                    />
                  </FieldShell>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button type="submit" size="sm" isLoading={isUploading}>
                    Upload resource
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}
