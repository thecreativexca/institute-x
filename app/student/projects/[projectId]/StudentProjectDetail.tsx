"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderKanban, Upload, ExternalLink } from "lucide-react";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { controlClassName } from "@/components/ui/field";
import { refreshNotifications } from "@/lib/notifications/client";
export function StudentProjectDetail({ project: p }: { project: any }) {
  const router = useRouter(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    s = p.submission;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget),
      r = await fetch(`/api/student/projects/${p._id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          text: f.get("text"),
          githubUrl: f.get("githubUrl"),
          liveUrl: f.get("liveUrl"),
          otherUrl: f.get("otherUrl"),
        }),
      }),
      j = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(j.error);
      return;
    }
    refreshNotifications();
    router.refresh();
  }
  return (
    <div className="space-y-6">
      <Link
        href="/student/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:text-primary-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>
      <StudentPageHeader
        title={p.title}
        description={`${p.difficulty} · ${p.totalMarks} marks · ${p.dueDate ? `Due ${new Date(p.dueDate).toLocaleDateString("en-IN")}` : "No deadline"}`}
        icon={<FolderKanban className="h-6 w-6" />}
        eyebrow="Project"
      />
      <Card className="rounded-2xl border-primary-100">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge>{p.status}</Badge>
            {p.course ? (
              <Badge variant="neutral">Course: {p.course.name}</Badge>
            ) : null}
            {p.internship ? (
              <Badge variant="neutral">Internship: {p.internship.title}</Badge>
            ) : null}
          </div>
          <h2 className="mt-5 font-semibold">Requirements</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
            {p.description}
          </p>
          {p.instructions ? (
            <>
              <h2 className="mt-5 font-semibold">Instructions</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {p.instructions}
              </p>
            </>
          ) : null}
          {p.submissionRequirements?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.submissionRequirements.map((x: string) => (
                <Badge variant="neutral" key={x}>
                  {x}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
      {s?.feedback ? (
        <Card>
          <CardContent className="p-5">
            <h2 className="font-semibold">Review feedback</h2>
            <p className="mt-2 text-sm text-slate-700">{s.feedback}</p>
            {s.score != null ? (
              <p className="mt-2 font-semibold">
                Score: {s.score}/{p.totalMarks}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
      {!["approved", "completed"].includes(s?.status) ? (
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="p-5">
            <h2 className="font-semibold">
              {s ? "Resubmit project" : "Submit project"}
            </h2>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <textarea
                name="text"
                defaultValue={s?.text}
                placeholder="Submission notes or report summary"
                className={controlClassName(false, "min-h-32")}
              />
              <Input
                name="githubUrl"
                type="url"
                defaultValue={s?.githubUrl}
                placeholder="GitHub URL"
              />
              <Input
                name="liveUrl"
                type="url"
                defaultValue={s?.liveUrl}
                placeholder="Live website URL"
              />
              <Input
                name="otherUrl"
                type="url"
                defaultValue={s?.otherUrl}
                placeholder="Other URL"
              />
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <Button type="submit" isLoading={busy}>
                <Upload className="h-4 w-4" />
                Submit project
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="flex items-center gap-3 p-5 text-emerald-700">
            <ExternalLink className="h-5 w-5" />
            <strong>Project approved</strong>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
