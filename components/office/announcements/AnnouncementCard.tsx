"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { OfficeAnnouncementSummary } from "@/lib/office/announcements";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit2, Eye, Archive, CheckCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AnnouncementCardProps {
  announcement: OfficeAnnouncementSummary;
}

const audienceLabels: Record<string, string> = {
  all: "All Users",
  students: "Course Students",
};

const statusConfig = {
  active: { label: "Published", variant: "success" as const, icon: CheckCircle },
  inactive: { label: "Draft/Archived", variant: "neutral" as const, icon: Archive },
} as const;

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = announcement.isActive;
  const statusCfg = isActive ? statusConfig.active : statusConfig.inactive;
  const audienceLabel = audienceLabels[announcement.audience] ?? announcement.audience;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/office/announcements/${announcement.id}`}
            className="font-medium text-slate-900 hover:text-primary-600 block truncate"
          >
            {announcement.title}
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Badge variant="primary">{audienceLabel}</Badge>
            {announcement.courseName && (
              <span>{announcement.courseName}</span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
            <span className="text-slate-600">
              Published: {announcement.publishedAt ? format(new Date(announcement.publishedAt), "MMM d, yyyy HH:mm") : "—"}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            By {announcement.createdByName} • Updated {format(new Date(announcement.updatedAt), "MMM d, yyyy")}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/office/announcements/${announcement.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
            View
          </Link>
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              aria-label="More actions"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                role="menu"
              >
                <Link
                  role="menuitem"
                  href={`/office/announcements/${announcement.id}`}
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View Details
                </Link>
                <Link
                  role="menuitem"
                  href={`/office/announcements/${announcement.id}/edit`}
                  onClick={() => setMenuOpen(false)}
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
      </div>
    </div>
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
