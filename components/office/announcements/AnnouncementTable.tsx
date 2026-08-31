"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeAnnouncementSummary } from "@/lib/office/announcements";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { MoreVertical, ExternalLink, AlertCircle, CheckCircle, Edit2, Eye, Archive } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnnouncementTableProps {
  announcements: OfficeAnnouncementSummary[];
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

export function AnnouncementTable({ announcements }: AnnouncementTableProps) {
  const [actionMenu, setActionMenu] = useState<{ announcementId: string; x: number; y: number } | null>(null);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Audience</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Course</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Published</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Updated</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {announcements.map((announcement) => {
              const isActive = announcement.isActive;
              const statusCfg = isActive ? statusConfig.active : statusConfig.inactive;
              const audienceLabel = audienceLabels[announcement.audience] ?? announcement.audience;

              return (
                <tr key={announcement.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/announcements/${announcement.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600 max-w-xs truncate block"
                    >
                      {announcement.title}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="primary">{audienceLabel}</Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {announcement.courseName || "—"}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusCfg.variant} className="gap-1">
                      <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {announcement.publishedAt
                      ? format(new Date(announcement.publishedAt), "MMM d, yyyy HH:mm")
                      : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {announcement.createdByName}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(announcement.updatedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/announcements/${announcement.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        View
                      </Link>
                      <Link
                        href={`/office/announcements/${announcement.id}/edit`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Link>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionMenu({ announcementId: announcement.id, x: rect.left, y: rect.bottom });
                          }}
                          aria-label="More actions"
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {actionMenu?.announcementId === announcement.id && (
                          <div
                            className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                            role="menu"
                          >
                            <Link
                              role="menuitem"
                              href={`/office/announcements/${announcement.id}`}
                              onClick={() => setActionMenu(null)}
                              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                              View Details
                            </Link>
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
                            {announcement.isActive ? (
                              <button
                                role="menuitem"
                                onClick={() => handleArchive(announcement.id)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Archive className="h-4 w-4" aria-hidden="true" />
                                Archive
                              </button>
                            ) : (
                              <button
                                role="menuitem"
                                onClick={() => handleActivate(announcement.id)}
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenu(null)}
          aria-hidden="true"
        />
      )}
    </>
  );
}

async function handleArchive(announcementId: string) {
  const res = await fetch(`/api/office/announcements/${announcementId}`, {
    method: "PATCH",
    body: new URLSearchParams({ action: "archive" }),
  });
  if (res.ok) window.location.reload();
}

async function handleActivate(announcementId: string) {
  const res = await fetch(`/api/office/announcements/${announcementId}`, {
    method: "PATCH",
    body: new URLSearchParams({ isActive: "true" }),
  });
  if (res.ok) window.location.reload();
}