"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, CheckCircle2 } from "lucide-react";

export function StudentAssignmentsClient() {
  return (
      <div className="space-y-6">
        <StudentPageHeader
          title="Assignments"
          description="Stay on top of coursework, submissions and instructor feedback."
          icon={<FileText className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Coursework"
        />

        {/* Pending Assignments */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Assignments</CardTitle>
                <CardDescription>Assignments that need your attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<FileText className="h-12 w-12" aria-hidden="true" />}
              title="No pending assignments"
              description="Your pending assignments will appear here when available."
            />
          </CardContent>
        </Card>

        {/* Completed Assignments */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Submitted Assignments</CardTitle>
            <CardDescription>Your completed assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12" aria-hidden="true" />}
              title="No submitted assignments yet"
              description="Your submitted assignments will appear here."
            />
          </CardContent>
        </Card>

        {/* Placeholder for future features */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Assignment System</CardTitle>
            <CardDescription>Full assignment submission and grading coming in later phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-primary-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">Assignments Coming Soon</h3>
              <p className="mt-1 text-sm text-slate-500">
                Assignment submission, file uploads, grading, and feedback will be implemented in future phases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
