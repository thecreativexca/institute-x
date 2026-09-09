"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Users,
  ClipboardList,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClassName } from "@/components/ui/field";
import { refreshNotifications } from "@/lib/notifications/client";

const tabs = [
  "overview",
  "applications",
  "students",
  "tasks",
  "projects",
  "milestones",
  "evaluation",
  "certificates",
] as const;

export function InternshipAdminDetail({ data }: { data: any }) {
  const router = useRouter();
  const params = useSearchParams();
  const initialTab = tabs.includes(params.get("tab") as (typeof tabs)[number])
    ? (params.get("tab") as (typeof tabs)[number])
    : "overview";
  const [tab, setTab] = useState<(typeof tabs)[number]>(initialTab);
  const [modal, setModal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const internship = data.internship;
  const pendingReviews =
    data.taskSubs.filter((item: any) => item.status === "submitted").length +
    data.projectSubs.filter((item: any) => ["submitted", "under_review"].includes(item.status)).length;

  async function call(url: string, body: Record<string, unknown>, method = "POST") {
    setError("");
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || "Unable to complete that action.");
      return false;
    }
    setModal(null);
    refreshNotifications();
    router.refresh();
    return true;
  }

  async function reviewTask(id: string, status: string, marks?: number) {
    const response = await fetch(`/api/office/internship-task-submissions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status,
        marks,
        feedback: status === "completed" ? "Approved" : "Please address the requirements and resubmit.",
      }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(json.error || "Unable to review this task.");
      return;
    }
    refreshNotifications();
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Link href="/office/internships" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-900">
        <ArrowLeft className="h-4 w-4" />
        Internships
      </Link>
      <header className="office-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{internship.title}</h1>
            <Badge variant={internship.status === "open" ? "success" : internship.status === "archived" ? "neutral" : "primary"}>
              {internship.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {internship.durationValue} {internship.durationUnit} · {internship.mode} · {internship.paidOrUnpaid}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={controlClassName(false, "w-40")}
            value={internship.status}
            onChange={(event) => void call(`/api/office/internships/${internship._id}`, { status: event.target.value }, "PATCH")}
            aria-label="Internship status"
          >
            {["draft", "open", "running", "completed", "archived"].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => setModal("assign")}>
            Assign student
          </Button>
          <Button onClick={() => setModal("task")}>New task</Button>
        </div>
      </header>
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-primary-100 bg-white p-1.5">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm capitalize ${
              tab === item ? "bg-primary-700 font-semibold text-white" : "font-medium text-slate-600 hover:bg-primary-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Applicants", data.applications.length, BriefcaseBusiness],
              ["Selected students", data.enrollments.length, Users],
              ["Pending reviews", pendingReviews, ClipboardList],
              ["Projects", data.projects.length, FolderKanban],
            ].map(([label, value, Icon]: any) => (
              <Card key={label}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 text-primary-600" />
                  <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold text-slate-900">Description</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{internship.description}</p>
              <h3 className="mt-5 font-semibold text-slate-900">Eligibility</h3>
              <p className="mt-2 text-sm text-slate-600">
                {internship.openToAllActiveStudents
                  ? "All active students"
                  : internship.eligibilityDescription ||
                    `${internship.eligibleCourses?.map((course: any) => course.name).join(", ") || "Selected students"}${
                      internship.minimumCourseProgress != null ? ` · ${internship.minimumCourseProgress}% minimum progress` : ""
                    }`}
              </p>
            </CardContent>
          </Card>
        </>
      ) : null}

      {tab === "applications" ? (
        <div className="space-y-3">
          {data.applications.length ? (
            data.applications.map((application: any) => (
              <Card key={application._id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{application.student?.name}</p>
                    <p className="text-xs text-slate-500">{application.student?.email}</p>
                    <p className="mt-2 text-sm text-slate-700">{application.message || "No statement"}</p>
                  </div>
                  <Badge>{application.status}</Badge>
                  {application.status === "pending" || application.status === "waitlisted" ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          void call(`/api/office/internships/${internship._id}/applications/${application._id}`, { status: "approved" }, "PATCH")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void call(`/api/office/internships/${internship._id}/applications/${application._id}`, { status: "waitlisted" }, "PATCH")
                        }
                      >
                        Waitlist
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          void call(`/api/office/internships/${internship._id}/applications/${application._id}`, { status: "rejected" }, "PATCH")
                        }
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={<BriefcaseBusiness className="h-10 w-10" />} title="No applications" description="Student applications will appear here." />
          )}
        </div>
      ) : null}

      {tab === "students" ? (
        <div className="space-y-3">
          {data.enrollments.length ? (
            data.enrollments.map((enrollment: any) => (
              <Card key={enrollment._id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{enrollment.student?.name}</p>
                    <p className="text-xs text-slate-500">{enrollment.student?.email}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Progress {enrollment.progressPercentage}% · Score {enrollment.finalScore ?? "—"} · Grade {enrollment.grade ?? "—"}
                    </p>
                  </div>
                  <Badge variant={enrollment.status === "completed" ? "success" : "primary"}>{enrollment.status}</Badge>
                  <Button size="sm" variant="outline" onClick={() => setModal(`evaluate:${enrollment._id}`)}>
                    Evaluate
                  </Button>
                  {enrollment.status !== "completed" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => void call(`/api/office/internship-enrollments/${enrollment._id}/complete`, { override: false })}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void call(`/api/office/internship-enrollments/${enrollment._id}/complete`, { override: true })}
                      >
                        Force complete
                      </Button>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={<Users className="h-10 w-10" />} title="No students assigned" description="Approve an application or assign a student to start the internship." />
          )}
        </div>
      ) : null}

      {tab === "tasks" ? (
        <div className="space-y-4">
          {data.tasks.length ? (
            data.tasks.map((task: any) => (
              <Card key={task._id}>
                <CardContent className="p-4">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{task.description}</p>
                    </div>
                    <Badge>{task.status}</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    {data.taskSubs
                      .filter((item: any) => item.task?._id === task._id || item.task === task._id)
                      .map((submission: any) => (
                        <div key={submission._id} className="flex flex-wrap items-center gap-2 rounded-lg bg-primary-50/70 p-3 text-sm">
                          <span className="mr-auto">
                            {submission.student?.name} · {submission.status.replace("_", " ")}
                          </span>
                          {submission.status === "submitted" || submission.status === "reviewed" ? (
                            <>
                              <Button size="sm" onClick={() => void reviewTask(submission._id, "completed", task.points ?? 0)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => void reviewTask(submission._id, "changes_required")}>
                                Request changes
                              </Button>
                            </>
                          ) : null}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="No tasks yet" description="Publish a task so enrolled students can submit work." />
          )}
        </div>
      ) : null}

      {tab === "projects" ? (
        <div>
          <Button asChild>
            <Link href={`/office/projects?internship=${internship._id}`}>Manage attached projects</Link>
          </Button>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.projects.map((project: any) => (
              <Card key={project._id}>
                <CardContent className="p-4">
                  <p className="font-semibold text-slate-900">{project.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {project.status} · {project.totalMarks} marks
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          {!data.projects.length ? (
            <EmptyState icon={<FolderKanban className="h-10 w-10" />} title="No projects attached" description="Create a project and link it to this internship." />
          ) : null}
        </div>
      ) : null}

      {tab === "milestones" ? (
        <div className="space-y-3">
          <Button onClick={() => setModal("milestone")}>Add milestone</Button>
          {data.milestones.map((milestone: any, index: number) => (
            <Card key={milestone._id}>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-primary-600">Milestone {index + 1}</p>
                <p className="font-semibold text-slate-900">{milestone.title}</p>
                <p className="text-sm text-slate-600">{milestone.description}</p>
              </CardContent>
            </Card>
          ))}
          {!data.milestones.length ? (
            <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="No milestones" description="Add a simple roadmap so students know what comes next." />
          ) : null}
        </div>
      ) : null}

      {tab === "evaluation" ? (
        <p className="rounded-2xl border border-primary-100 bg-white p-5 text-sm text-slate-600">
          Open the Students tab to record criterion scores and final feedback. Completing an intern requires tasks and projects if any are published.
        </p>
      ) : null}

      {tab === "certificates" ? (
        <div className="space-y-3">
          {data.enrollments.filter((item: any) => item.status === "completed").length ? (
            data.enrollments
              .filter((item: any) => item.status === "completed")
              .map((enrollment: any) => (
                <Card key={enrollment._id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="flex-1">{enrollment.student?.name}</span>
                    <Button
                      size="sm"
                      disabled={Boolean(enrollment.certificate)}
                      onClick={() => void call(`/api/office/internship-enrollments/${enrollment._id}/certificate`, { override: false })}
                    >
                      {enrollment.certificate ? "Issued" : "Issue certificate"}
                    </Button>
                  </CardContent>
                </Card>
              ))
          ) : (
            <EmptyState icon={<CheckCircle2 className="h-10 w-10" />} title="No completed internships" description="Complete a student first, then issue their internship certificate." />
          )}
        </div>
      ) : null}

      <Modal open={modal === "assign"} onClose={() => setModal(null)} title="Assign student">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void call(`/api/office/internships/${internship._id}/assign`, {
              studentId: new FormData(event.currentTarget).get("studentId"),
            });
          }}
          className="space-y-4"
        >
          <select required name="studentId" className={controlClassName(false)}>
            <option value="">Select student</option>
            {data.students.map((student: any) => (
              <option value={student._id} key={student._id}>
                {student.name} · {student.email}
              </option>
            ))}
          </select>
          <Button type="submit">Assign</Button>
        </form>
      </Modal>
      <Modal open={modal === "task"} onClose={() => setModal(null)} title="Create internship task">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void call(`/api/office/internships/${internship._id}/tasks`, {
              title: form.get("title"),
              description: form.get("description"),
              dueDate: form.get("dueDate") || null,
              points: form.get("points") ? Number(form.get("points")) : null,
              status: "published",
              required: true,
            });
          }}
          className="space-y-4"
        >
          <Input name="title" required placeholder="Task title" />
          <textarea name="description" required placeholder="Description" className={controlClassName(false, "min-h-28")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="dueDate" type="date" />
            <Input name="points" type="number" min="0" placeholder="Marks" />
          </div>
          <Button type="submit">Publish task</Button>
        </form>
      </Modal>
      <Modal open={modal === "milestone"} onClose={() => setModal(null)} title="Add milestone">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void call(`/api/office/internships/${internship._id}/milestones`, {
              title: form.get("title"),
              description: form.get("description"),
            });
          }}
          className="space-y-4"
        >
          <Input name="title" required placeholder="Milestone title" />
          <textarea name="description" placeholder="What should the intern complete?" className={controlClassName(false, "min-h-24")} />
          <Button type="submit">Save milestone</Button>
        </form>
      </Modal>
      {modal?.startsWith("evaluate:") ? (
        <Modal open onClose={() => setModal(null)} title="Final evaluation">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const names = [
                "Attendance / Activity",
                "Task Performance",
                "Project Performance",
                "Professionalism",
                "Communication",
                "Final Project",
              ];
              const criteria = names.map((name, index) => ({
                name,
                score: Number(form.get(`s${index}`)),
                maxScore: Number(form.get(`m${index}`)),
              }));
              void call(`/api/office/internship-enrollments/${modal.split(":")[1]}/evaluate`, {
                criteria,
                adminFeedback: form.get("feedback"),
              });
            }}
            className="space-y-3"
          >
            {[
              "Attendance / Activity",
              "Task Performance",
              "Project Performance",
              "Professionalism",
              "Communication",
              "Final Project",
            ].map((name, index) => (
              <div key={name} className="grid grid-cols-[1fr_5rem_5rem] items-center gap-2 text-sm">
                <span>{name}</span>
                <Input required name={`s${index}`} type="number" min="0" defaultValue="0" aria-label={`${name} score`} />
                <Input required name={`m${index}`} type="number" min="1" defaultValue={index === 2 || index === 5 ? 20 : 10} aria-label={`${name} maximum`} />
              </div>
            ))}
            <textarea name="feedback" placeholder="Final feedback" className={controlClassName(false, "min-h-24")} />
            <Button type="submit">Save evaluation</Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
