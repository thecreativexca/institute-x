"use client";

import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LinkWrapper } from "@/components/ui/link-button";

import type { CertificateListItem } from "@/types/certificate";
import {
  BookOpen,
  Clock,
  Calendar,
  Award,
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";

interface Course {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  level: string;
  durationWeeks?: number;
  price?: number;
  currency: string;
  thumbnailUrl?: string;
  category: { _id: string; name: string } | null;
}

interface Enrollment {
  _id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
}

interface CurriculumLesson {
  id: string;
  title: string;
  durationMinutes: number | null;
}

interface CurriculumModule {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}

interface StudentCourseDetailClientProps {
  course: Course;
  enrollment: Enrollment;
  studentId: string;
  modules?: CurriculumModule[];
  certificate?: CertificateListItem | null;
}

export function StudentCourseDetailClient({ course, enrollment, modules = [], certificate = null }: StudentCourseDetailClientProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "active":
        return <Badge variant="primary">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/student/courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to My Courses
        </Link>

        {/* Course Header */}
        <section className="student-grid-pattern relative grid gap-6 overflow-hidden rounded-[1.75rem] border border-primary-900 bg-[#103a50] p-5 text-white shadow-2xl shadow-primary-950/15 sm:p-7 lg:grid-cols-3">
          <div aria-hidden="true" className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-accent-300/20 blur-3xl" />
          <div className="lg:col-span-1">
            {course.thumbnailUrl ? (
              <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-primary-900 shadow-xl ring-1 ring-white/10 lg:aspect-[3/4]">
                <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white/[0.08] ring-1 ring-white/10 lg:aspect-[3/4]">
                <BookOpen className="h-24 w-24 text-accent-200" aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="relative space-y-4 lg:col-span-2 lg:self-center">
            <div className="flex flex-wrap items-center gap-2">
              {course.category && (
                <Badge variant="primary">{course.category.name}</Badge>
              )}
              <Badge variant="neutral">{course.level}</Badge>
              {getStatusBadge(enrollment.status)}
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{course.name}</h1>

            <p className="max-w-2xl leading-7 text-primary-100">{course.shortDescription ?? "No description available."}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-primary-100">
              {course.durationWeeks && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {course.durationWeeks} weeks
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" aria-hidden="true" />
                Self-paced learning
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4" aria-hidden="true" />
                Certificate on completion
              </span>
            </div>

            {/* Enrollment status */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Your Status</p>
                  <p className="text-sm text-primary-200">
                    Enrolled on {new Date(enrollment.enrolledAt).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(enrollment.status)}
              </div>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
            <CardDescription>Track your learning progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-600">Overall Progress</span>
                  <span className="font-medium text-slate-900">0%</span>
                </div>
                <Progress value={0} className="h-3" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-primary-50 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">Lessons Completed</p>
                </div>
                <div className="rounded-xl bg-accent-50 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">0</p>
                  <p className="text-sm text-slate-500">Total Lessons</p>
                </div>
                <div className="rounded-xl bg-primary-50 p-4 text-center">
                  <p className="text-3xl font-bold text-slate-900">0%</p>
                  <p className="text-sm text-slate-500">Completion Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Curriculum — lesson list linking to each lesson page (Phase 8) */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <CardTitle>Course Curriculum</CardTitle>
            <CardDescription>
              Open a lesson to view its content and learning resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-8 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-primary-400" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">
                  No lessons published yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Lessons will appear here as soon as they are published.
                </p>
              </div>
            ) : (
              <ol className="space-y-5">
                {modules.map((module, moduleIndex) => (
                  <li key={module.id}>
                    <p className="text-sm font-semibold text-slate-900">
                      {moduleIndex + 1}. {module.title}
                    </p>
                    {module.lessons.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        No lessons in this module yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {module.lessons.map((lesson) => (
                          <li key={lesson.id}>
                            <Link
                              href={`/student/courses/${course._id}/lessons/${lesson.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-slate-700 hover:border-primary-100 hover:bg-primary-50 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <PlayCircle
                                  className="h-4 w-4 shrink-0 text-slate-400"
                                  aria-hidden="true"
                                />
                                <span className="truncate">{lesson.title}</span>
                              </span>
                              {lesson.durationMinutes ? (
                                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                                  <Clock className="h-3 w-3" aria-hidden="true" />
                                  {lesson.durationMinutes} min
                                </span>
                              ) : null}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        {/* Learning actions */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="rounded-2xl border-primary-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <PlayCircle className="h-5 w-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">Continue Learning</CardTitle>
                  <CardDescription className="text-xs">Resume your last lesson</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {modules[0]?.lessons[0] ? (
                <Button asChild className="w-full"><Link href={`/student/courses/${course._id}/lessons/${modules[0].lessons[0].id}`}>Open course player</Link></Button>
              ) : <p className="text-sm text-slate-500">No published lesson is available yet.</p>}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <CheckCircle2 className="h-5 w-5 text-amber-700" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">Assignments</CardTitle>
                  <CardDescription className="text-xs">Course assignments</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full"><Link href="/student/assignments">View assignments</Link></Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-primary-100">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-100">
                  <Award className="h-5 w-5 text-accent-600" aria-hidden="true" />
                </div>
                <div>
                  <CardTitle className="text-base">Certificate</CardTitle>
                  <CardDescription className="text-xs">
                    {enrollment.status !== "completed"
                      ? "Earn on completion"
                      : certificate
                        ? "Your official certificate"
                        : "Ready to issue"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {enrollment.status !== "completed" ? (
                <p className="text-sm text-slate-500">
                  Certificate locked until course completion requirements are satisfied.
                </p>
              ) : certificate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">
                      <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                      {certificate.status === "revoked" ? "Revoked" : "Certificate Available"}
                    </Badge>
                  </div>
                  <p className="font-mono text-xs text-slate-600">{certificate.certificateNumber}</p>
                  <Button asChild variant="secondary" size="sm">
                    <LinkWrapper href={`/student/certificates/${certificate.id}`}>
                      <Award className="h-4 w-4" aria-hidden="true" /> View Certificate
                    </LinkWrapper>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">
                    Certificate pending — the institute will issue your official
                    certificate once your completion is reviewed. It will appear
                    under My Certificates.
                  </p>
                  <Button asChild variant="outline" size="sm">
                    <LinkWrapper href="/student/certificates">
                      <Award className="h-4 w-4" aria-hidden="true" /> Go to My Certificates
                    </LinkWrapper>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}
