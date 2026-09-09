"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
  Search,
} from "lucide-react";

import { OfficeProjectCard } from "@/components/office/projects/office-project-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { refreshNotifications } from "@/lib/notifications/client";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatCard } from "@/components/ui/stat-card";

export function AdminProjectsClient({ data }: { data: any }) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState<{
    id: string;
    name: string;
    totalMarks: number;
  } | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewScore, setReviewScore] = useState("");

  const internshipFilter = params.get("internship");
  const projectFilter = params.get("project");

  const stats = useMemo(() => {
    const pendingReviews = data.submissions.filter((s: any) =>
      ["submitted", "under_review"].includes(s.status),
    ).length;
    const approved = data.submissions.filter((s: any) =>
      ["approved", "completed"].includes(s.status),
    ).length;
    return {
      total: data.projects.length,
      submissions: data.submissions.length,
      pendingReviews,
      approved,
    };
  }, [data]);

  const projects = data.projects.filter((p: any) => {
    const subs = data.submissions.filter(
      (s: any) => s.project === p._id || s.project?._id === p._id,
    );
    const hasPending = subs.some((s: any) =>
      ["submitted", "under_review"].includes(s.status),
    );
    const hasApproved = subs.some((s: any) =>
      ["approved", "completed"].includes(s.status),
    );

    return (
      (!internshipFilter || p.internship?._id === internshipFilter) &&
      (!projectFilter || p._id === projectFilter) &&
      (!search || p.title.toLowerCase().includes(search.toLowerCase())) &&
      (!statusFilter ||
        (statusFilter === "pending" && hasPending) ||
        (statusFilter === "approved" && hasApproved) ||
        (statusFilter === "no_submissions" && subs.length === 0))
    );
  });

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = {
      title: f.get("title"),
      description: f.get("description"),
      instructions: f.get("instructions"),
      course: f.get("course") || null,
      internship: f.get("internship") || null,
      assignedStudents: f.getAll("students"),
      difficulty: f.get("difficulty"),
      dueDate: f.get("dueDate") || null,
      totalMarks: Number(f.get("totalMarks")),
      passingMarks: f.get("passingMarks")
        ? Number(f.get("passingMarks"))
        : null,
      required: true,
      allowLateSubmission: f.get("allowLateSubmission") === "on",
      submissionRequirements: String(f.get("requirements") || "")
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      status: "published",
    };
    const r = await fetch("/api/office/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) {
      setError(j.error);
      return;
    }
    setOpen(false);
    refreshNotifications();
    router.refresh();
  }

  async function review(id: string, status: string, score?: number) {
    const response = await fetch(`/api/office/project-submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status,
        score,
        feedback: reviewFeedback || undefined,
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || "Unable to review this submission.");
      return;
    }
    setReviewing(null);
    setReviewFeedback("");
    setReviewScore("");
    refreshNotifications();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <header className="office-page-header flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
            Practical work
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
            Projects
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Publish course, internship, or standalone projects and review
            submissions.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create project
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Published projects" value={stats.total} icon={FolderKanban} />
        <StatCard
          label="Total submissions"
          value={stats.submissions}
          icon={CheckCircle2}
          surfaceClassName="bg-accent-100"
          toneClassName="text-accent-800"
        />
        <StatCard
          label="Pending review"
          value={stats.pendingReviews}
          icon={Clock3}
          surfaceClassName="bg-amber-50"
          toneClassName="text-amber-700"
        />
        <StatCard
          label="Approved"
          value={stats.approved}
          icon={CheckCircle2}
          surfaceClassName="bg-emerald-50"
          toneClassName="text-emerald-700"
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title"
              className="pl-9"
            />
          </div>
          <select
            className={controlClassName(false)}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All projects</option>
            <option value="pending">Pending review</option>
            <option value="approved">Has approvals</option>
            <option value="no_submissions">No submissions</option>
          </select>
        </CardContent>
      </Card>

      {projects.length ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-800">
                {projects.length}
              </span>{" "}
              project{projects.length === 1 ? "" : "s"}
            </p>
            {statusFilter ? (
              <Badge variant="primary" className="capitalize">
                {statusFilter.replace("_", " ")}
              </Badge>
            ) : null}
          </div>
          <div className="space-y-4">
            {projects.map((project: any) => {
              const subs = data.submissions.filter(
                (s: any) => s.project === project._id || s.project?._id === project._id,
              );
              return (
                <OfficeProjectCard
                  key={project._id}
                  project={project}
                  submissions={subs}
                  onReview={(submission, totalMarks) => {
                    setReviewing({
                      id: submission._id,
                      name: submission.student?.name ?? "Student",
                      totalMarks,
                    });
                    setReviewScore(String(submission.score ?? totalMarks));
                  }}
                />
              );
            })}
          </div>
        </>
      ) : (
        <EmptyState
          icon={<FolderKanban className="h-10 w-10" />}
          title={search || statusFilter ? "No matching projects" : "No projects"}
          description={
            search || statusFilter
              ? "Try adjusting your search or filter."
              : "Create a course, internship, or standalone project."
          }
          action={
            !search && !statusFilter ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            ) : undefined
          }
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create project"
        className="max-h-[92vh] max-w-2xl overflow-y-auto"
      >
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">
            Title
            <Input name="title" required className="mt-1" />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Description
            <textarea
              name="description"
              required
              className={controlClassName(false, "mt-1 min-h-24")}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Instructions
            <textarea
              name="instructions"
              className={controlClassName(false, "mt-1 min-h-24")}
            />
          </label>
          <label className="text-sm font-medium">
            Course
            <select name="course" className={controlClassName(false, "mt-1")}>
              <option value="">None</option>
              {data.courses.map((x: any) => (
                <option key={x._id} value={x._id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Internship
            <select
              name="internship"
              defaultValue={internshipFilter || ""}
              className={controlClassName(false, "mt-1")}
            >
              <option value="">None</option>
              {data.internships.map((x: any) => (
                <option key={x._id} value={x._id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Difficulty
            <select
              name="difficulty"
              className={controlClassName(false, "mt-1")}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Deadline
            <Input name="dueDate" type="date" className="mt-1" />
          </label>
          <label className="text-sm font-medium">
            Total marks
            <Input
              name="totalMarks"
              type="number"
              min="1"
              defaultValue="100"
              className="mt-1"
            />
          </label>
          <label className="text-sm font-medium">
            Passing marks
            <Input name="passingMarks" type="number" min="0" className="mt-1" />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Submission requirements
            <Input
              name="requirements"
              placeholder="GitHub URL, live site, PDF report"
              className="mt-1"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Selected students
            <select
              name="students"
              multiple
              className={controlClassName(false, "mt-1 min-h-28")}
            >
              {data.students.map((x: any) => (
                <option key={x._id} value={x._id}>
                  {x.name} · {x.email}
                </option>
              ))}
            </select>
          </label>
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="allowLateSubmission" />
            Allow late submission
          </label>
          {error ? (
            <p className="sm:col-span-2 text-sm text-red-700">{error}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit">Publish project</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title={reviewing ? `Review submission — ${reviewing.name}` : "Review"}
      >
        <div className="space-y-4">
          <textarea
            value={reviewFeedback}
            onChange={(e) => setReviewFeedback(e.target.value)}
            placeholder="Feedback for the student"
            className={controlClassName(false, "min-h-24")}
          />
          <label className="text-sm font-medium">
            Score
            <Input
              type="number"
              min="0"
              max={reviewing?.totalMarks}
              value={reviewScore}
              onChange={(e) => setReviewScore(e.target.value)}
              className="mt-1"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="danger"
              onClick={() =>
                reviewing && review(reviewing.id, "changes_required")
              }
            >
              Request changes
            </Button>
            <Button
              type="button"
              onClick={() =>
                reviewing &&
                review(
                  reviewing.id,
                  "approved",
                  Number(reviewScore || reviewing.totalMarks),
                )
              }
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
