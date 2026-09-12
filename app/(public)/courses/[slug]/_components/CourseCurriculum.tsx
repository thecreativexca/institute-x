"use client";

import { Accordion } from "@/components/ui/accordion";
import type { CatalogModule, CatalogLesson } from "@/lib/config/catalog";

interface CourseCurriculumProps {
  syllabus: CatalogModule[];
}

function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

function LessonItem({ lesson }: { lesson: CatalogLesson }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary-100 bg-primary-50/45 p-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm flex-shrink-0">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{lesson.title}</p>
        {lesson.durationMinutes && (
          <p className="text-sm text-slate-500">{formatDuration(lesson.durationMinutes)}</p>
        )}
      </div>
      {lesson.isPreview && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Preview
        </span>
      )}
    </div>
  );
}

function ModuleItem({ module, index }: { module: CatalogModule; index: number }) {
  const totalLessons = module.lessons.length;
  const previewLessons = module.lessons.filter((l) => l.isPreview).length;

  return (
    <Accordion
      type="single"
      items={[
        {
          value: module.slug,
          trigger: (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-lg flex-shrink-0">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{module.title}</p>
                  {module.description && (
                    <p className="text-sm text-slate-500 truncate">{module.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 flex-shrink-0">
                <span>{totalLessons} lessons</span>
                {previewLessons > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {previewLessons} preview
                  </span>
                )}
              </div>
            </div>
          ),
          content: (
            <div className="space-y-3">
              {module.lessons.map((lesson) => (
                <LessonItem key={lesson.slug} lesson={lesson} />
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}

export function CourseCurriculum({ syllabus }: CourseCurriculumProps) {
  if (!syllabus || syllabus.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="curriculum-heading" className="space-y-4">
      <h2 id="curriculum-heading" className="text-2xl font-semibold text-slate-900">
        Course Curriculum
      </h2>
      <p className="text-slate-600">
        {syllabus.length} module{syllabus.length !== 1 ? "s" : ""},{" "}
        {syllabus.reduce((acc, m) => acc + m.lessons.length, 0)} lesson{syllabus.reduce((acc, m) => acc + m.lessons.length, 0) !== 1 ? "s" : ""}
        {syllabus.some((m) => m.lessons.some((l) => l.isPreview)) && " • Preview lessons available"}
      </p>
      <div className="space-y-3">
        {syllabus.map((module, index) => (
          <ModuleItem key={module.slug} module={module} index={index} />
        ))}
      </div>
    </section>
  );
}
