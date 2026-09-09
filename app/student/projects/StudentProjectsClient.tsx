"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  PencilLine,
  Send,
} from "lucide-react";

import { StudentProjectCard } from "@/components/projects/project-card";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard } from "@/components/ui/stat-card";

const tabs = [
  { id: "active", label: "Active" },
  { id: "submitted", label: "Submitted" },
  { id: "changes", label: "Changes Required" },
  { id: "completed", label: "Completed" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function matchesTab(row: any, tab: TabId) {
  const status = row.submission?.status;
  if (tab === "active")
    return !status || ["not_started", "in_progress"].includes(status);
  if (tab === "submitted")
    return ["submitted", "under_review"].includes(status);
  if (tab === "changes") return status === "changes_required";
  return ["approved", "completed"].includes(status);
}

export function StudentProjectsClient({ rows }: { rows: any[] }) {
  const [tab, setTab] = useState<TabId>("active");

  const counts = useMemo(
    () =>
      tabs.reduce(
        (acc, item) => {
          acc[item.id] = rows.filter((row) => matchesTab(row, item.id)).length;
          return acc;
        },
        {} as Record<TabId, number>,
      ),
    [rows],
  );

  const filtered = rows.filter((row) => matchesTab(row, tab));
  const tabItems = tabs.map((item) => ({
    ...item,
    count: counts[item.id],
  }));

  const emptyCopy: Record<TabId, { title: string; description: string }> = {
    active: {
      title: "No active projects",
      description:
        "Published course, internship, or assigned projects will appear here.",
    },
    submitted: {
      title: "Nothing submitted yet",
      description: "Projects awaiting office review will show up in this tab.",
    },
    changes: {
      title: "No revisions requested",
      description:
        "Projects that need changes after review will appear here.",
    },
    completed: {
      title: "No completed projects",
      description: "Approved and completed projects will be listed here.",
    },
  };

  return (
    <div className="space-y-8">
      <StudentPageHeader
        title="Projects"
        description="Build practical work, submit evidence, and respond to office feedback."
        icon={<FolderKanban className="h-6 w-6" />}
        eyebrow="Portfolio work"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active"
          value={counts.active}
          icon={PencilLine}
        />
        <StatCard
          label="Submitted"
          value={counts.submitted}
          icon={Send}
          surfaceClassName="bg-accent-100"
          toneClassName="text-accent-800"
        />
        <StatCard
          label="Changes required"
          value={counts.changes}
          icon={Clock3}
          surfaceClassName="bg-amber-50"
          toneClassName="text-amber-700"
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          icon={CheckCircle2}
          surfaceClassName="bg-emerald-50"
          toneClassName="text-emerald-700"
        />
      </div>

      <FilterTabs
        items={tabItems}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        ariaLabel="Project filters"
      />

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <StudentProjectCard key={row._id} row={row} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10" />}
          title={emptyCopy[tab].title}
          description={emptyCopy[tab].description}
        />
      )}
    </div>
  );
}
