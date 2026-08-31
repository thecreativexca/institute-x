import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAnnouncementById } from "@/lib/office/announcements/queries";
import { Course } from "@/models/Course";
import { OfficeShell } from "@/components/office/OfficeShell";
import { EditAnnouncementForm } from "@/components/office/announcements/EditAnnouncementForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Edit Announcement — Office Portal",
  description: "Edit an existing announcement.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface EditAnnouncementPageProps {
  params: Promise<{ announcementId: string }>;
}

export default async function EditAnnouncementPage({ params }: EditAnnouncementPageProps) {
  const { user } = await getValidatedSession();
  const { announcementId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/office/announcements/${announcementId}/edit`);
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the announcement management portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  if (!hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to edit announcements.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const announcement = await getOfficeAnnouncementById(announcementId);

  if (!announcement) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Announcement not found</CardTitle>
            <CardDescription>
              The announcement you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/office/announcements">Back to Announcements</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const courses = await Course.find({ status: "published" }).select("name").sort({ name: 1 }).lean();
  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="max-w-3xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/office/announcements/${announcementId}`}>
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">Edit Announcement</h1>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Update the announcement details below.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Announcement Details</CardTitle>
            <CardDescription>
              Modify the announcement details. Changes to published announcements will be visible immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EditAnnouncementForm
              announcement={announcement}
              courseOptions={courseOptions}
            />
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
