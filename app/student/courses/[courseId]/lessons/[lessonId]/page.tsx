import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getValidatedStudent } from "@/lib/auth/helpers";
import {
  getStudentLessonContext,
  listStudentLessonResources,
} from "@/lib/resources/queries";
import { RESOURCE_ERROR, ResourceError } from "@/lib/resources/errors";
import { ErrorState } from "@/components/ui/error-state";
import { LessonResources } from "@/components/student/resources/lesson-resources";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { ArrowLeft, BookOpen } from "lucide-react";

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
    redirect("/login");
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

  return (
    <div className="mx-auto w-full max-w-4xl">
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

        {context.lessonContent ? (
          <section
            aria-label="Lesson description"
            className="rounded-2xl border border-primary-100 bg-white p-5 text-slate-700 shadow-card sm:p-6"
          >
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
      </div>
    </div>
  );
}
