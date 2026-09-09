"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Sparkles,
} from "lucide-react";

import { StudentInternshipCard } from "@/components/internships/internship-card";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard } from "@/components/ui/stat-card";

const tabs = [
  { id: "available", label: "Available" },
  { id: "applications", label: "My Applications" },
  { id: "active", label: "My Internships" },
  { id: "completed", label: "Completed" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function matchesTab(row: any, tab: TabId) {
  if (tab === "completed") return row.enrollment?.status === "completed";
  if (tab === "active")
    return row.enrollment && row.enrollment.status !== "completed";
  if (tab === "applications")
    return (
      row.application &&
      !row.enrollment &&
      row.application.status !== "withdrawn"
    );
  return (
    row.status === "open" &&
    !row.enrollment &&
    (!row.application || row.application.status === "withdrawn")
  );
}

export function StudentInternshipsClient({ rows }: { rows: any[] }) {
  const [tab, setTab] = useState<TabId>("available");

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

  const emptyCopy: Record<
    TabId,
    { title: string; description: string }
  > = {
    available: {
      title: "No internships open right now",
      description:
        "Programs appear here when the office publishes them and you become eligible.",
    },
    applications: {
      title: "No applications yet",
      description: "Apply to an open internship to track your application here.",
    },
    active: {
      title: "No active internships",
      description:
        "Once selected, your assigned internships will show up in this list.",
    },
    completed: {
      title: "No completed internships",
      description:
        "Finished programs and certificates will appear here after completion.",
    },
  };

  return (
    <div className="space-y-8">
      <StudentPageHeader
        title="Internships"
        description="Apply to institute programs, track applications, and continue assigned work."
        icon={<BriefcaseBusiness className="h-6 w-6" />}
        eyebrow="Career experience"
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Open programs"
          value={counts.available}
          icon={Sparkles}
          surfaceClassName="bg-emerald-50"
          toneClassName="text-emerald-700"
        />
        <StatCard
          label="Applications"
          value={counts.applications}
          icon={ClipboardList}
          surfaceClassName="bg-accent-100"
          toneClassName="text-accent-800"
        />
        <StatCard
          label="Active internships"
          value={counts.active}
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Completed"
          value={counts.completed}
          icon={CheckCircle2}
          surfaceClassName="bg-primary-50"
          toneClassName="text-primary-700"
        />
      </div>

      <FilterTabs
        items={tabItems}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        ariaLabel="Internship filters"
      />

      {filtered.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((row) => (
            <StudentInternshipCard key={row._id} row={row} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BriefcaseBusiness className="h-10 w-10" />}
          title={emptyCopy[tab].title}
          description={emptyCopy[tab].description}
        />
      )}
    </div>
  );
}
