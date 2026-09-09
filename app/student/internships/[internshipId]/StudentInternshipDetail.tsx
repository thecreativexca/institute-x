"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Clock3, Upload } from "lucide-react";

import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { controlClassName } from "@/components/ui/field";
import { refreshNotifications } from "@/lib/notifications/client";

export function StudentInternshipDetail({ data }: { data: any }) {
  const router = useRouter();
  const internship = data.internship;
  const [modal, setModal] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const subMap = new Map(data.taskSubmissions.map((item: any) => [item.task, item]));

  async function post(url: string, body?: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const response = await fetch(url, {
      method: "POST",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) {
      setError(json.error || "Something went wrong.");
      return false;
    }
    setModal(null);
    refreshNotifications();
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-6">
      <Link href="/student/internships" className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-900">
        <ArrowLeft className="h-4 w-4" />
        Internships
      </Link>
      <StudentPageHeader
        title={internship.title}
        description={`${internship.durationValue} ${internship.durationUnit} · ${internship.mode} · ${internship.paidOrUnpaid}`}
        icon={<BriefcaseBusiness className="h-6 w-6" />}
        eyebrow="Internship"
      />
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <Card className="rounded-2xl border-primary-100">
        <CardContent className="p-5">
          <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{internship.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {internship.skillsRequired?.map((skill: string) => (
              <Badge key={skill} variant="neutral">
                {skill}
              </Badge>
            ))}
          </div>
          {!data.enrollment && !data.application ? (
            <div className="mt-5">
              {data.eligibility.eligible && internship.applicationRequired ? (
                <Button onClick={() => setModal("apply")}>Apply for internship</Button>
              ) : data.eligibility.eligible && !internship.applicationRequired ? (
                <Button isLoading={busy} onClick={() => void post(`/api/student/internships/${internship._id}/enroll`)}>
                  Join internship
                </Button>
              ) : (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{data.eligibility.reason || "Applications are not available."}</p>
              )}
            </div>
          ) : null}
          {data.application && !data.enrollment ? (
            <p className="mt-5 rounded-xl bg-primary-50 p-3 text-sm text-primary-900">
              Application status: <strong className="capitalize">{data.application.status}</strong>
              {data.application.status === "pending" ? " · The office will review this shortly." : null}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {data.enrollment ? (
        <>
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="p-5">
              <div className="flex justify-between gap-3">
                <h2 className="font-semibold text-slate-900">Overall progress</h2>
                <strong>{data.progress?.overall ?? 0}%</strong>
              </div>
              <Progress value={data.progress?.overall ?? 0} className="mt-3" />
              <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                <span>
                  Tasks {data.progress?.tasks.completed}/{data.progress?.tasks.total}
                </span>
                <span>
                  Projects {data.progress?.projects.completed}/{data.progress?.projects.total}
                </span>
                <span className="capitalize">Status {data.enrollment.status}</span>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Milestones</h2>
            {data.milestones.length ? (
              data.milestones.map((milestone: any, index: number) => (
                <Card key={milestone._id} className="rounded-2xl border-primary-100">
                  <CardContent className="flex gap-3 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{milestone.title}</p>
                      <p className="text-sm text-slate-600">{milestone.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <EmptyState icon={<Clock3 className="h-10 w-10" />} title="No milestones yet" description="The office will add the internship roadmap here." />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Tasks</h2>
            {data.tasks.length ? (
              data.tasks.map((task: any) => {
                const submission: any = subMap.get(task._id);
                return (
                  <Card key={task._id} className="rounded-2xl border-primary-100">
                    <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{task.title}</p>
                        <p className="text-sm text-slate-600">{task.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          <Clock3 className="mr-1 inline h-3 w-3" />
                          {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString("en-IN")}` : "No deadline"}
                        </p>
                        {submission?.feedback ? (
                          <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Feedback: {submission.feedback}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={
                          submission?.status === "completed"
                            ? "success"
                            : submission?.status === "changes_required"
                              ? "warning"
                              : submission?.status === "submitted"
                                ? "primary"
                                : "neutral"
                        }
                      >
                        {(submission?.status || "pending").replace("_", " ")}
                      </Badge>
                      {submission?.status !== "completed" ? (
                        <Button size="sm" onClick={() => setModal(`task:${task._id}`)}>
                          {submission ? "Resubmit" : "Submit"}
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <EmptyState icon={<Clock3 className="h-10 w-10" />} title="No tasks published" description="Assigned tasks will appear here after the office publishes them." />
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Projects</h2>
            {data.projects.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.projects.map((project: any) => (
                  <Link href={`/student/projects/${project._id}`} key={project._id}>
                    <Card className="h-full rounded-2xl border-primary-100 hover:shadow-[var(--shadow-card-hover)]">
                      <CardContent className="p-4">
                        <p className="font-semibold text-slate-900">{project.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {project.difficulty} · {project.totalMarks} marks
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Clock3 className="h-10 w-10" />} title="No projects attached" description="Internship projects will show here when published." />
            )}
          </section>

          {data.evaluation ? (
            <Card className="rounded-2xl border-primary-100">
              <CardContent className="p-5">
                <h2 className="font-semibold text-slate-900">Final evaluation</h2>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {data.evaluation.percentage}% · {data.evaluation.grade}
                </p>
                <p className="mt-2 text-sm text-slate-600">{data.evaluation.adminFeedback}</p>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}

      <Modal open={modal === "apply"} onClose={() => setModal(null)} title="Apply for internship">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void post(`/api/student/internships/${internship._id}/apply`, {
              message: form.get("message"),
              portfolioUrl: form.get("portfolioUrl"),
              githubUrl: form.get("githubUrl"),
            });
          }}
          className="space-y-4"
        >
          <textarea name="message" placeholder="Why are you a good fit?" className={controlClassName(false, "min-h-28")} />
          <Input name="portfolioUrl" type="url" placeholder="Portfolio URL" />
          <Input name="githubUrl" type="url" placeholder="GitHub URL" />
          <Button type="submit" isLoading={busy}>
            Submit application
          </Button>
        </form>
      </Modal>

      {modal?.startsWith("task:") ? (
        <Modal open onClose={() => setModal(null)} title="Submit task">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              void post(`/api/student/internship-tasks/${modal.split(":")[1]}/submit`, {
                text: form.get("text"),
                githubUrl: form.get("githubUrl"),
                liveUrl: form.get("liveUrl"),
                externalUrl: form.get("externalUrl"),
              });
            }}
            className="space-y-4"
          >
            <textarea name="text" placeholder="Submission notes" className={controlClassName(false, "min-h-28")} />
            <Input name="githubUrl" type="url" placeholder="GitHub URL" />
            <Input name="liveUrl" type="url" placeholder="Live URL" />
            <Input name="externalUrl" type="url" placeholder="Other URL" />
            <Button type="submit" isLoading={busy}>
              <Upload className="h-4 w-4" />
              Submit task
            </Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
