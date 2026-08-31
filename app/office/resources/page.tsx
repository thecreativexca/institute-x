import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { isResourceManagerRole } from "@/lib/resources/access";
import { listRecentResourcesForStaff } from "@/lib/resources/queries";
import { getAllowedExtensions } from "@/lib/resources/validation";
import { env } from "@/lib/config/env";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ResourceUploadPanel } from "@/components/office/resource-upload-panel";
import { DeleteResourceButton } from "@/components/office/delete-resource-button";
import { OfficeShell } from "@/components/office/OfficeShell";

export const metadata: Metadata = {
  title: "Learning Resources",
  description: "Staff foundation for managing course learning resources.",
  robots: { index: false, follow: false },
};

/** Dynamically refresh when a resource is uploaded/deleted. */
export const dynamic = "force-dynamic";

export default async function OfficeResourcesPage() {
  const { user } = await getValidatedSession();

  if (!user) {
    redirect("/office/login?callbackUrl=/office/resources");
  }

  if (!isResourceManagerRole(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              Only content managers and administrators can manage learning resources.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/office" className={buttonVariants("outline", "md", "mx-auto")}>
              Back to Dashboard
            </Link>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  let recent: Awaited<ReturnType<typeof listRecentResourcesForStaff>> = [];
  let listError = false;
  try {
    recent = await listRecentResourcesForStaff(15);
  } catch {
    listError = true;
  }

  return (
    <OfficeShell session={user}>
      <div className="space-y-8">
      <header className="office-page-header">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Content library</p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Learning Resources</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload PDFs and study material to course lessons. Stored securely on
          Cloudinary; metadata in the institute database.
        </p>
      </header>

      <ResourceUploadPanel
        maxSizeMB={env.maxResourceFileSizeMB}
        allowedExtensions={getAllowedExtensions()}
      />

      <section aria-labelledby="recent-resources-heading" className="space-y-4">
        <h2 id="recent-resources-heading" className="text-xl font-semibold tracking-tight text-slate-900">
          Recently added
        </h2>

        {listError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            Unable to load recent resources. Please refresh the page.
          </p>
        ) : recent.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-8 text-center text-sm text-slate-500">
            No resources have been uploaded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {recent.map((resource) => (
              <li
                key={resource.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-primary-50/30 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {resource.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                    <span>{resource.type}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatFileSize(resource.fileSize)}</span>
                    {resource.lessonTitle ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{resource.lessonTitle}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={resource.isPublished ? "success" : "neutral"}>
                    {resource.isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-slate-400">{resource.access}</span>
                  <DeleteResourceButton resourceId={resource.id} title={resource.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </div>
    </OfficeShell>
  );
}
