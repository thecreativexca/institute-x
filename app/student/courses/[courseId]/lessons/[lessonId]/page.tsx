import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getValidatedStudent } from "@/lib/auth/helpers";
import {
  getStudentLessonContext,
  listStudentLessonResources,
} from "@/lib/resources/queries";
import { RESOURCE_ERROR, ResourceError } from "@/lib/resources/errors";
import { parseYouTubeVideoId, buildYouTubeEmbedUrl } from "@/lib/office/courses/youtube";
import { ErrorState } from "@/components/ui/error-state";
import { LessonResources } from "@/components/student/resources/lesson-resources";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { LessonProgressControls } from "@/components/student/lesson-progress-controls";
import { ArrowLeft, BookOpen, CheckCircle2, Circle, Clapperboard, FileText, ExternalLink } from "lucide-react";

interface RouteParams {
  params: Promise<{ courseId: string; lessonId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Lesson",
    description: "Lesson content and learning resources.",
    robots: { index: false, follow: false },
  };
}

/**
 * Student lesson view — hosts the Learning Resources section (Phase 8).
 * The full lesson player remains part of the course learning system.
 */
export default async function StudentLessonPage({ params }: RouteParams) {
  const { user: student } = await getValidatedStudent();

  if (!student) {
    redirect("/login?reauth=1");
  }

  const resolved = await params;
  const { courseId, lessonId } = resolved;

  let context: Awaited<ReturnType<typeof getStudentLessonContext>> | null = null;
  let contextError: "not-found" | "error" | null = null;

  try {
    context = await getStudentLessonContext({
      studentId: student.id,
      lessonId,
    });

    // Guard against cross-course lesson access: the URL course must match
    // the lesson's real course.
    if (context.courseId !== courseId) {
      contextError = "not-found";
    }
  } catch (error) {
    contextError =
      error instanceof ResourceError && error.code === RESOURCE_ERROR.NOT_FOUND
        ? "not-found"
        : "error";
  }

  if (contextError === "not-found") {
    notFound();
  }

  if (!context) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <ErrorState
          title="Unable to open this lesson."
          action={
            <Link
              href={`/student/courses/${courseId}`}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Back to course
            </Link>
          }
        />
      </div>
    );
  }

  let resources: Awaited<ReturnType<typeof listStudentLessonResources>> | null = null;
  let resourcesFailed = false;

  try {
    resources = await listStudentLessonResources(lessonId);
  } catch (error) {
    console.error(
      "Lesson resources failed to load:",
      error instanceof Error ? error.message : error
    );
    resourcesFailed = true;
  }

  const videoId = context.videoUrl ? parseYouTubeVideoId(context.videoUrl) : null;
  const showVideo = videoId !== null && context.contentType !== "pdf";
  const showPdf = context.contentType === "pdf" && Boolean(context.pdfUrl);

  const lessonCount = context.curriculum.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedCount = context.curriculum.reduce((sum, module) => sum + module.lessons.filter((lesson) => lesson.completed).length, 0);
  const courseProgress = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="space-y-6">
        <StudentPageHeader
          title={context.lessonTitle}
          description={`Continue learning in ${context.courseName}.`}
          icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
          eyebrow={context.moduleTitle ?? "Course lesson"}
          action={
            <Link
              href={`/student/courses/${courseId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-semibold text-primary-800 shadow-sm hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to course
            </Link>
          }
        />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="space-y-6">
        {showVideo && videoId ? (
          <section
            aria-label="Video lesson"
            className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-primary-100 px-5 py-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <Clapperboard className="h-5 w-5 text-red-700" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Video lesson</h2>
                <p className="text-xs text-slate-500">Stream this lesson video</p>
              </div>
            </div>
            <div className="aspect-video w-full bg-slate-950">
              <iframe
                src={buildYouTubeEmbedUrl(videoId)}
                title={`${context.lessonTitle} — video`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </section>
        ) : null}

        {showPdf && context.pdfUrl ? (
          <section
            aria-label="PDF lesson"
            className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card"
          >
            <div className="flex items-center justify-between gap-3 border-b border-primary-100 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100">
                  <FileText className="h-5 w-5 text-accent-800" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Lesson PDF</h2>
                  <p className="text-xs text-slate-500">Read the attached document</p>
                </div>
              </div>
              <a
                href={context.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open PDF <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            <iframe src={context.pdfUrl} title={`${context.lessonTitle} — PDF`} className="h-[75vh] w-full" />
          </section>
        ) : null}

        {context.lessonContent ? (
          <section
            aria-label="Lesson description"
            className="rounded-2xl border border-primary-100 bg-white p-5 text-slate-700 shadow-card sm:p-6"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Lesson notes</h2>
            <p className="whitespace-pre-line leading-relaxed">
              {context.lessonContent}
            </p>
          </section>
        ) : null}

        <LessonResources
          resources={resources}
          hasError={resourcesFailed}
          retryHref={`/student/courses/${courseId}/lessons/${lessonId}`}
        />

        <LessonProgressControls
          courseId={courseId}
          lessonId={lessonId}
          initiallyCompleted={context.completed}
          previousLessonId={context.previousLessonId}
          nextLessonId={context.nextLessonId}
        />
          </div>

          <aside className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card lg:sticky lg:top-24" aria-label="Course curriculum">
            <div className="border-b border-primary-100 bg-primary-50/70 p-4">
              <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-slate-900">Course progress</span><span className="font-bold text-primary-700">{courseProgress}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-primary-100"><div className="h-full rounded-full bg-primary-600" style={{ width: `${courseProgress}%` }} /></div>
              <p className="mt-2 text-xs text-slate-500">{completedCount} of {lessonCount} lessons complete</p>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-3">
              {context.curriculum.map((module) => (
                <section key={module.id} className="mb-4 last:mb-0">
                  <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{module.title}</h2>
                  <ul className="mt-1.5 space-y-1">
                    {module.lessons.map((lesson) => {
                      const active = lesson.id === lessonId;
                      return <li key={lesson.id}><Link href={`/student/courses/${courseId}/lessons/${lesson.id}`} aria-current={active ? "page" : undefined} className={`flex items-start gap-2 rounded-lg px-2 py-2 text-sm ${active ? "bg-primary-100 font-semibold text-primary-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>{lesson.completed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}<span>{lesson.title}</span></Link></li>;
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
