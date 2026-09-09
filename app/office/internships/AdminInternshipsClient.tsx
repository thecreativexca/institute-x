"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  BriefcaseBusiness,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { OfficeInternshipCard } from "@/components/internships/internship-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClassName } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";
import { refreshNotifications } from "@/lib/notifications/client";

export function AdminInternshipsClient({
  initial,
  courses,
}: {
  initial: any[];
  courses: any[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      total: initial.length,
      open: initial.filter((x) => x.status === "open").length,
      running: initial.filter((x) => x.status === "running").length,
      draft: initial.filter((x) => x.status === "draft").length,
    }),
    [initial],
  );

  const rows = useMemo(
    () =>
      initial.filter(
        (x) =>
          (!status || x.status === status) &&
          (!search || x.title.toLowerCase().includes(search.toLowerCase())),
      ),
    [initial, search, status],
  );

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      description: f.get("description"),
      shortDescription: f.get("shortDescription"),
      durationValue: Number(f.get("durationValue")),
      durationUnit: f.get("durationUnit"),
      mode: f.get("mode"),
      paidOrUnpaid: f.get("paidOrUnpaid"),
      stipendAmount: f.get("stipendAmount")
        ? Number(f.get("stipendAmount"))
        : null,
      seats: Number(f.get("seats")),
      skillsRequired: String(f.get("skills") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      eligibleCourses: f.getAll("eligibleCourses"),
      minimumCourseProgress: f.get("minimumCourseProgress")
        ? Number(f.get("minimumCourseProgress"))
        : null,
      courseCompletionRequired: f.get("courseCompletionRequired") === "on",
      applicationRequired: f.get("applicationRequired") === "on",
      autoApproval: f.get("autoApproval") === "on",
      openToAllActiveStudents: f.get("openToAllActiveStudents") === "on",
      status: f.get("status"),
      applicationEndDate: f.get("applicationEndDate") || null,
      completionRules: {
        requireTasks: true,
        requireProjects: true,
        minimumProgress: 100,
      },
    };
    const res = await fetch("/api/office/internships", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error);
      return;
    }
    setOpen(false);
    refreshNotifications();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="office-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
            Institute programs
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
            Internships
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Create programs, review applications, assign work, and issue
            certificates.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create internship
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total programs" value={stats.total} icon={BriefcaseBusiness} />
        <StatCard
          label="Open for applications"
          value={stats.open}
          icon={Sparkles}
          surfaceClassName="bg-emerald-50"
          toneClassName="text-emerald-700"
        />
        <StatCard
          label="Running"
          value={stats.running}
          icon={CheckCircle2}
          surfaceClassName="bg-accent-100"
          toneClassName="text-accent-800"
        />
        <StatCard
          label="Drafts"
          value={stats.draft}
          icon={Archive}
          surfaceClassName="bg-slate-100"
          toneClassName="text-slate-700"
        />
      </div>

      <Card className="rounded-2xl border-primary-100 shadow-card">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[1fr_13rem] sm:p-5">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 h-4 w-4 text-slate-400"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search internships by title"
            />
          </div>
          <select
            className={controlClassName(false)}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {["draft", "open", "running", "completed", "archived"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {rows.length ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{rows.length}</span>{" "}
              program{rows.length === 1 ? "" : "s"}
            </p>
            {status ? (
              <Badge variant="primary" className="capitalize">
                {status}
              </Badge>
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((internship) => (
              <OfficeInternshipCard key={internship._id} internship={internship} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<BriefcaseBusiness className="h-10 w-10" />}
          title={search || status ? "No matching internships" : "No internships"}
          description={
            search || status
              ? "Try adjusting your search or status filter."
              : "Create the institute's first internship program."
          }
          action={
            !search && !status ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Create internship
              </Button>
            ) : undefined
          }
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create internship"
        description="Configure the core program and eligibility rules."
        className="max-h-[92vh] max-w-3xl overflow-y-auto"
      >
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Title
            <Input name="title" required className="mt-1" />
          </label>
          <label className="text-sm font-medium">
            Short description
            <Input name="shortDescription" className="mt-1" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            Description
            <textarea
              name="description"
              required
              className={controlClassName(false, "mt-1 min-h-28")}
            />
          </label>
          <label className="text-sm font-medium">
            Duration
            <Input
              name="durationValue"
              type="number"
              min="1"
              defaultValue="6"
              required
              className="mt-1"
            />
          </label>
          <label className="text-sm font-medium">
            Unit
            <select
              name="durationUnit"
              className={controlClassName(false, "mt-1")}
            >
              <option value="weeks">Weeks</option>
              <option value="days">Days</option>
              <option value="months">Months</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Mode
            <select name="mode" className={controlClassName(false, "mt-1")}>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Paid status
            <select
              name="paidOrUnpaid"
              className={controlClassName(false, "mt-1")}
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Seats
            <Input
              name="seats"
              type="number"
              min="1"
              defaultValue="1"
              className="mt-1"
            />
          </label>
          <label className="text-sm font-medium">
            Stipend
            <Input
              name="stipendAmount"
              type="number"
              min="0"
              className="mt-1"
            />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            Skills (comma-separated)
            <Input name="skills" className="mt-1" />
          </label>
          <label className="text-sm font-medium">
            Minimum course progress
            <Input
              name="minimumCourseProgress"
              type="number"
              min="0"
              max="100"
              className="mt-1"
            />
          </label>
          <label className="text-sm font-medium">
            Application deadline
            <Input name="applicationEndDate" type="date" className="mt-1" />
          </label>
          <label className="sm:col-span-2 text-sm font-medium">
            Eligible courses
            <select
              name="eligibleCourses"
              multiple
              className={controlClassName(false, "mt-1 min-h-28")}
            >
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2 grid gap-2 text-sm sm:grid-cols-2">
            {[
              ["applicationRequired", "Application required", true],
              ["autoApproval", "Auto approve", false],
              ["courseCompletionRequired", "Course completion required", false],
              ["openToAllActiveStudents", "Open to all active students", false],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="flex gap-2">
                <input
                  type="checkbox"
                  name={String(name)}
                  defaultChecked={Boolean(checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="text-sm font-medium">
            Status
            <select name="status" className={controlClassName(false, "mt-1")}>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
            </select>
          </label>
          {error ? (
            <p className="sm:col-span-2 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={busy}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
