import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { RESOURCE_ERROR, ResourceError } from "@/lib/resources/errors";
import { RESOURCE_ACCESS, RESOURCE_TYPES } from "@/lib/constants";
import { getStudentResourceIfAllowed } from "@/lib/resources/access";
import { buildInlineUrl } from "@/lib/resources/cloudinary";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { Lesson } from "@/models/Lesson";
import { Course } from "@/models/Course";
import { connectDB } from "@/lib/db/connect";

interface RouteParams {
  params: Promise<{ resourceId: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "View Resource",
    robots: { index: false, follow: false },
  };
}

/** Quick availability probe so a dead asset renders our error state, not a raw browser error. */
async function isAssetReachable(fileUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(buildInlineUrl(fileUrl), {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Secure resource viewer. Every request passes the full student access
 * chain server-side before any file URL is exposed to the browser.
 */
export default async function StudentResourceViewPage({ params }: RouteParams) {
  const { user: student } = await getValidatedStudent();

  if (!student) {
    redirect("/login");
  }

  const resolved = await params;

  let context: Awaited<ReturnType<typeof getStudentResourceIfAllowed>> | null = null;

  try {
    context = await getStudentResourceIfAllowed({
      studentId: student.id,
      resourceId: resolved.resourceId,
    });
  } catch (error) {
    // Missing, unpublished, private, not-enrolled and cross-course resources
    // all resolve to a clean 404 — no database or policy details leak.
    if (
      error instanceof ResourceError &&
      (error.code === RESOURCE_ERROR.NOT_FOUND ||
        error.code === RESOURCE_ERROR.NOT_ENROLLED ||
        error.code === RESOURCE_ERROR.NOT_PUBLISHED ||
        error.code === RESOURCE_ERROR.ACCESS_DENIED ||
        error.code === RESOURCE_ERROR.RELATIONSHIP_INVALID)
    ) {
      notFound();
    }
    throw error;
  }

  const { resource, backHref } = context;

  await connectDB();
  const [lesson, course] = await Promise.all([
    Lesson.findById(resource.lesson).select("title").lean(),
    Course.findById(resource.course).select("name").lean(),
  ]);

  const isPdf = resource.type === RESOURCE_TYPES.PDF;
  const isText = resource.mimeType.toLowerCase() === "text/plain";
  const canEmbed = isPdf || isText;
  const canDownload = resource.access === RESOURCE_ACCESS.VIEW_AND_DOWNLOAD;
  const downloadHref = `/api/student/resources/${resource._id.toString()}/download`;

  const assetOk = canEmbed ? await isAssetReachable(resource.fileUrl) : true;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="space-y-6">
        <div className="student-page-header flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to lesson
            </Link>
            {course ? (
              <p className="mt-1 truncate text-xs text-slate-500">{course.name}</p>
            ) : null}
            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {resource.title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {lesson ? (
                <>
                  {lesson.title}
                  <span aria-hidden="true"> · </span>
                </>
              ) : null}
              {formatFileSize(resource.fileSize)}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {canEmbed && assetOk ? (
              <a
                href={buildInlineUrl(resource.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-sm font-medium text-primary-800 hover:bg-primary-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Open in new tab
              </a>
            ) : null}
            {canDownload ? (
              <a
                href={downloadHref}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 text-sm font-medium text-white hover:bg-primary-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download
              </a>
            ) : null}
          </div>
        </div>



        {canEmbed && assetOk ? (
          <section
            aria-label={`${resource.title} viewer`}
            className="overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-card"
          >
            {/* Browser-native PDF/text rendering with zoom controls. */}
            <iframe
              src={buildInlineUrl(resource.fileUrl)}
              title={`${resource.title} — document viewer`}
              className="h-[70vh] min-h-[480px] w-full bg-slate-100"
            />
          </section>
        ) : canEmbed ? (
          <section
            className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"
            role="alert"
          >
            <h2 className="text-base font-semibold text-red-900">
              Unable to open this resource.
            </h2>
            <p className="mt-1 text-sm text-red-800/90">
              The file is temporarily unavailable. Please try again shortly.
            </p>
            <a
              href={backHref}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-800 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
            >
              Try Again
            </a>
          </section>
        ) : (
          /* Documents without native browser preview (e.g. DOC/DOCX). */
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-primary-100 bg-white px-6 py-14 text-center shadow-card">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100"
              aria-hidden="true"
            >
              <FileText className="h-6 w-6 text-primary-600" />
            </span>
            <h2 className="text-base font-semibold text-slate-900">{resource.title}</h2>
            <p className="max-w-md text-sm text-slate-500">
              This document does not preview in the browser. Use the download
              option above to open it on your device.
            </p>
          </section>
        )}

        {resource.access === RESOURCE_ACCESS.VIEW_ONLY && isPdf ? (
          <p className="text-center text-xs text-slate-400">
            This resource is provided for online viewing.
          </p>
        ) : null}
      </div>
    </div>
  );
}
