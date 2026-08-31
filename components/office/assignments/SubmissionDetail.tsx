"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Download, AlertCircle, CheckCircle, Clock, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { OfficeSubmissionDetail, PreviousSubmission, GradingHistoryEntry } from "@/lib/office/assignments";

interface SubmissionDetailProps {
  submission: OfficeSubmissionDetail;
  canGrade: boolean;
}

const statusConfig = {
  submitted: { label: "Submitted", variant: "warning" as const, icon: Clock },
  graded: { label: "Graded", variant: "success" as const, icon: CheckCircle },
} as const;

export function SubmissionDetail({ submission, canGrade }: SubmissionDetailProps) {
  const router = useRouter();
  const [isGrading, setIsGrading] = useState(false);
  const [gradeData, setGradeData] = useState({
    score: submission.score !== null ? submission.score.toString() : "",
    feedback: submission.feedback || "",
    internalNote: "",
    status: "graded" as "graded" | "returned_for_resubmission",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleGradeChange = (name: string, value: string | boolean) => {
    setGradeData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateGrade = () => {
    const newErrors: Record<string, string> = {};
    const score = parseInt(gradeData.score, 10);
    if (!gradeData.score || isNaN(score)) {
      newErrors.score = "Score is required";
    } else if (score < 0 || score > submission.maxScore) {
      newErrors.score = `Score must be between 0 and ${submission.maxScore}`;
    }
    if (!gradeData.feedback.trim()) {
      newErrors.feedback = "Feedback is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGrade()) return;

    setIsGrading(true);
    try {
      const body = new FormData();
      body.set("score", gradeData.score);
      body.set("feedback", gradeData.feedback.trim());
      if (gradeData.internalNote) body.set("internalNote", gradeData.internalNote.trim());
      body.set("status", gradeData.status);

      const res = await fetch(`/api/office/assignments/${submission.assignmentId}/submissions/${submission.id}`, {
        method: "PATCH",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
      } else {
        setErrors({ form: data.error || "Failed to grade submission" });
      }
    } catch (error) {
      setErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsGrading(false);
    }
  };

  const isLate = submission.isLate;
  const statusCfg = statusConfig[submission.status];

  return (
    <div className="space-y-6">
      {/* Submission Header */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <CardTitle>{submission.assignmentTitle}</CardTitle>
            <CardDescription>
              {submission.courseName} • Submitted by {submission.studentName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
            {isLate && (
              <Badge variant="danger" className="gap-1">
                <AlertCircle className="h-3 w-3" aria-hidden="true" />
                Late Submission
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-slate-500">Submitted</dt>
              <dd className="text-sm font-medium text-slate-900">
                {format(new Date(submission.submittedAt), "MMM d, yyyy HH:mm")}
              </dd>
            </div>
            {submission.gradedAt && (
              <div>
                <dt className="text-sm text-slate-500">Graded</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {format(new Date(submission.gradedAt), "MMM d, yyyy HH:mm")}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-slate-500">Max Score</dt>
              <dd className="text-sm font-medium text-slate-900">{submission.maxScore}</dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Score</dt>
              <dd className={cn("text-lg font-bold", submission.score !== null ? "text-slate-900" : "text-slate-400")}>
                {submission.score !== null ? `${submission.score} / ${submission.maxScore}` : "Not graded"}
              </dd>
            </div>
          </dl>

          {submission.content && (
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">Text Response</h4>
              <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap">
                {submission.content}
              </div>
            </div>
          )}

          {submission.fileUrl && (
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="h-10 w-10 text-slate-400" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{submission.originalFileName || "Submission file"}</p>
                <p className="text-sm text-slate-500">Click to download or view</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </a>
              </Button>
            </div>
          )}

          {!submission.content && !submission.fileUrl && (
            <div className="text-center py-8 text-slate-500">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-2" aria-hidden="true" />
              <p>No content or file submitted</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grading Form */}
      {canGrade && submission.status === "submitted" && (
        <Card>
          <CardHeader>
            <CardTitle>Grade Submission</CardTitle>
            <CardDescription>
              Enter the score and feedback for this submission. The student will be notified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGradeSubmit} className="space-y-4" noValidate>
              {errors.form && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" aria-hidden="true" />
                    <span>{errors.form}</span>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="score" className="required">
                  Score (out of {submission.maxScore})
                </Label>
                <Input
                  id="score"
                  type="number"
                  min="0"
                  max={submission.maxScore}
                  value={gradeData.score}
                  onChange={(e) => handleGradeChange("score", e.target.value)}
                  placeholder="Enter score"
                  className={cn(errors.score && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                />
                {errors.score && <p className="mt-1 text-sm text-red-600">{errors.score}</p>}
              </div>

              <div>
                <Label htmlFor="feedback" className="required">
                  Feedback (visible to student)
                </Label>
                <Textarea
                  id="feedback"
                  value={gradeData.feedback}
                  onChange={(e) => handleGradeChange("feedback", e.target.value)}
                  placeholder="Provide constructive feedback..."
                  rows={4}
                  className={cn(errors.feedback && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                />
                {errors.feedback && <p className="mt-1 text-sm text-red-600">{errors.feedback}</p>}
              </div>

              <div>
                <Label htmlFor="internalNote">
                  Internal Note (staff only)
                </Label>
                <Textarea
                  id="internalNote"
                  value={gradeData.internalNote}
                  onChange={(e) => handleGradeChange("internalNote", e.target.value)}
                  placeholder="Internal grading notes (not visible to student)..."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="status">Grading Status</Label>
                <Select value={gradeData.status} onValueChange={(value) => handleGradeChange("status", value)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="returned_for_resubmission">Return for Resubmission</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button type="submit" disabled={isGrading} className="gap-2">
                  {isGrading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Grading...
                    </>
                  ) : (
                    "Submit Grade"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {submission.status === "graded" && (
        <Card>
          <CardHeader>
            <CardTitle>Grading Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-slate-500">Final Score</dt>
                <dd className="text-2xl font-bold text-slate-900">
                  {submission.score} / {submission.maxScore}
                  ({Math.round(((submission.score ?? 0) / submission.maxScore) * 100)}%)
                </dd>
              </div>
              <div>
                <dt className="text-sm text-slate-500">Graded At</dt>
                <dd className="text-sm font-medium text-slate-900">
                  {submission.gradedAt ? format(new Date(submission.gradedAt), "MMM d, yyyy HH:mm") : "—"}
                </dd>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-2">Feedback</h4>
              <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg border border-slate-200 whitespace-pre-wrap">
                {submission.feedback || "No feedback provided"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Submissions */}
      {submission.previousSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Submissions</CardTitle>
            <CardDescription>
              This student has submitted this assignment before.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {submission.previousSubmissions.map((prev) => (
                <div key={prev.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">
                      Submitted {format(new Date(prev.submittedAt), "MMM d, yyyy HH:mm")}
                    </span>
                    <div className="flex items-center gap-2">
                      {prev.isLate && (
                        <Badge variant="danger" className="gap-1 text-xs">
                          <AlertCircle className="h-2.5 w-2.5" aria-hidden="true" />
                          Late
                        </Badge>
                      )}
                      <Badge variant={prev.status === "graded" ? "success" : "warning"}>
                        {prev.status === "graded" ? "Graded" : "Submitted"}
                      </Badge>
                    </div>
                  </div>
                  {prev.score !== null && (
                    <p className="text-sm text-slate-600">
                      Score: {prev.score} / {submission.maxScore}
                    </p>
                  )}
                  {prev.feedback && (
                    <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap">
                      {prev.feedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grading History */}
      {submission.gradingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Grading History</CardTitle>
            <CardDescription>
              Audit trail of grading actions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {submission.gradingHistory.map((entry) => (
                <div key={entry.id} className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.isRegrade ? "primary" : "success"} className="gap-1">
                        {entry.isRegrade ? "Regrade" : "Grade"}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900">
                        {entry.gradedByName} • {format(new Date(entry.gradedAt), "MMM d, yyyy HH:mm")}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">
                      {entry.score} / {submission.maxScore}
                    </span>
                  </div>
                  {entry.previousScore !== undefined && (
                    <p className="text-sm text-slate-600">
                      Previous score: {entry.previousScore}
                    </p>
                  )}
                  {entry.feedback && (
                    <p className="mt-2 text-sm text-slate-700 bg-slate-50 p-3 rounded whitespace-pre-wrap">
                      {entry.feedback}
                    </p>
                  )}
                  {entry.internalNote && (
                    <p className="mt-2 text-sm text-amber-800 bg-amber-50 p-3 rounded whitespace-pre-wrap">
                      <strong>Internal Note:</strong> {entry.internalNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}