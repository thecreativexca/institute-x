"use client";

import { format } from "date-fns";
import { useState } from "react";
import Link from "next/link";
import type { OfficeAnnouncementDetail } from "@/lib/office/announcements";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { AlertCircle, CheckCircle, MoreVertical, Edit2, Eye, Archive, Mail } from "lucide-react";

interface AnnouncementDetailProps {
  announcement: OfficeAnnouncementDetail;
}

const audienceLabels: Record<string, string> = {
  all: "All Users",
  students: "Course Students",
  staff: "Staff Only",
};

const statusConfig = {
  active: { label: "Published", variant: "success" as const, icon: CheckCircle },
  inactive: { label: "Draft/Archived", variant: "neutral" as const, icon: Archive },
} as const;

export function AnnouncementDetail({ announcement }: AnnouncementDetailProps) {
  const [actionMenu, setActionMenu] = useState<{ x: number; y: number } | null>(null);
  const isActive = announcement.isActive;
  const statusCfg = isActive ? statusConfig.active : statusConfig.inactive;
  const audienceLabel = audienceLabels[announcement.audience] ?? announcement.audience;

  const handleArchive = async () => {
    const res = await fetch(`/api/office/announcements/${announcement.id}`, {
      method: "PATCH",
      body: new URLSearchParams({ action: "archive" }),
    });
    if (res.ok) window.location.reload();
  };

  const handleActivate = async () => {
    const res = await fetch(`/api/office/announcements/${announcement.id}`, {
      method: "PATCH",
      body: new URLSearchParams({ isActive: "true" }),
    });
    if (res.ok) window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant={statusCfg.variant} className="gap-1 text-sm">
            <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
            {statusCfg.label}
          </Badge>
          <Badge variant="primary">{audienceLabel}</Badge>
          {announcement.courseName && (
            <Badge variant="secondary">{announcement.courseName}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setActionMenu({ x: rect.left, y: rect.bottom });
              }}
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
            {actionMenu && (
              <div
                className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                role="menu"
              >
                <Link
                  role="menuitem"
                  href={`/office/announcements/${announcement.id}/edit`}
                  onClick={() => setActionMenu(null)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" aria-hidden="true" />
                  Edit Announcement
                </Link>
                <hr className="my-1 border-slate-200" />
                {isActive ? (
                  <button
                    role="menuitem"
                    onClick={handleArchive}
                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Archive className="h-4 w-4" aria-hidden="true" />
                    Archive
                  </button>
                ) : (
                  <button
                    role="menuitem"
                    onClick={handleActivate}
                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" aria-hidden="true" />
                    Publish
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Announcement Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-slate max-w-none whitespace-pre-wrap">{announcement.body}</div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Audience</dt>
              <dd className="text-sm font-medium text-slate-900">{audienceLabel}</dd>
            </div>
            {announcement.courseName && (
              <div className="sm:col-span-2">
                <dt className="text-sm text-slate-500">Course</dt>
                <dd className="text-sm font-medium text-slate-900">{announcement.courseName}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-slate-500">Email Sent</dt>
              <dd className="text-sm font-medium text-slate-900">
                {announcement.sendEmail ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Published At</dt>
              <dd className="text-sm font-medium text-slate-900">
                {announcement.publishedAt ? format(new Date(announcement.publishedAt), "MMM d, yyyy HH:mm") : "Not published"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Created By</dt>
              <dd className="text-sm font-medium text-slate-900">{announcement.createdByName}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Created</dt>
              <dd className="text-sm font-medium text-slate-900">{format(new Date(announcement.createdAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Last Updated</dt>
              <dd className="text-sm font-medium text-slate-900">{format(new Date(announcement.updatedAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}