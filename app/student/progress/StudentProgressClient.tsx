"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { LinkWrapper } from "@/components/ui/link-button";
import { BarChart2, ChevronRight, BookOpen, Award, Clock, CheckCircle2 } from "lucide-react";

export function StudentProgressClient() {
  return (
      <div className="space-y-6">
        <StudentPageHeader
          title="Learning Progress"
          description="See how far you have come across every course, lesson and learning goal."
          icon={<BarChart2 className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Your growth"
        />

        {/* Overall Progress */}
        <Card className="overflow-hidden rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Overall Progress</CardTitle>
            <CardDescription>Your combined progress across all courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-4">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-600">Total Completion</span>
                  <span className="text-2xl font-bold text-slate-900">0%</span>
                </div>
                <Progress value={0} className="h-4" />
                <p className="mt-2 text-sm text-slate-500">0 of 0 lessons completed across all courses</p>
              </div>
              <div className="rounded-xl bg-primary-50 p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-500">Active Courses</p>
              </div>
              <div className="rounded-xl bg-accent-50 p-4 text-center">
                <p className="text-3xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-500">Completed Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per Course Progress */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Individual progress for each course</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <LinkWrapper href="/student/courses">View All Courses <ChevronRight className="h-4 w-4 ml-1" /></LinkWrapper>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<BarChart2 className="h-12 w-12" aria-hidden="true" />}
              title="No progress data yet"
              description="Your course progress will appear here once you start learning."
              action={
                <Button asChild>
                  <LinkWrapper href="/courses">Browse Courses</LinkWrapper>
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* Learning Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                  <Clock className="h-6 w-6 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0h</p>
                  <p className="text-sm text-slate-500">Learning Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">Lessons Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-100">
                  <BookOpen className="h-6 w-6 text-accent-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">Current Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-100">
                  <Award className="h-6 w-6 text-accent-700" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">Certificates Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Placeholder for future features */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
            <CardDescription>Detailed progress charts and insights coming in later phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-8 text-center">
              <BarChart2 className="mx-auto h-12 w-12 text-primary-400" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-medium text-slate-900">Advanced Analytics Coming Soon</h3>
              <p className="mt-1 text-sm text-slate-500">
                Detailed progress charts, time tracking, and learning insights will be implemented in future phases.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
