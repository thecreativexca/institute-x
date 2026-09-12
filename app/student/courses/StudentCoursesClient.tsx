"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  Clock,
  BookMarked,
} from "lucide-react";

interface Course {
  enrollment: {
    _id: string;
    status: string;
    enrolledAt: string;
    completedAt?: string | null;
  };
  course: {
    _id: string;
    name: string;
    slug: string;
    shortDescription?: string;
    level: string;
    durationWeeks?: number;
    thumbnailUrl?: string;
  };
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  currentLesson?: {
    id: string;
    title: string;
    moduleTitle: string;
  };
  status: "not_started" | "in_progress" | "completed";
}

interface StudentCoursesClientProps {
  courses: Course[];
  activeFilter?: string;
  certificateCourseIds?: string[];
}

const filters = [
  { value: "", label: "All Courses", icon: BookOpen },
  { value: "in_progress", label: "In Progress", icon: Clock },
  { value: "not_started", label: "Not Started", icon: BookMarked },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

export function StudentCoursesClient({ courses, activeFilter, certificateCourseIds = [] }: StudentCoursesClientProps) {
  const searchParams = useSearchParams();
  const currentFilter = activeFilter ?? searchParams.get("status") ?? "";

  const filteredCourses = courses.filter((course) => {
    if (!currentFilter) return true;
    return course.status === currentFilter;
  });

  const getStatusBadge = (status: Course["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "in_progress":
        return <Badge variant="primary">In Progress</Badge>;
      default:
        return <Badge variant="neutral">Not Started</Badge>;
    }
  };

  return (
      <div className="space-y-6">
        <StudentPageHeader
          title="My Courses"
          description="Manage your enrolled courses, continue lessons and track every milestone."
          icon={<BookOpen className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Learning library"
          action={
          <Button asChild variant="outline">
            <Link href="/courses">Browse Catalog <ChevronRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          }
        />

        {/* Filters */}
        <Card className="rounded-2xl border-primary-100">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <Filter className="h-5 w-5 text-slate-500 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-700">Filter:</span>
              <div className="flex flex-wrap gap-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    asChild
                    variant={currentFilter === filter.value ? "primary" : "outline"}
                    size="sm"
                    className="gap-1.5"
                  >
                    <Link
                      href={`/student/courses${filter.value ? `?status=${filter.value}` : ""}`}
                      onClick={() => {}}
                    >
                      <filter.icon className="h-4 w-4" aria-hidden="true" />
                      {filter.label}
                      {currentFilter === filter.value && (
                        <X className="h-3 w-3" aria-hidden="true" />
                      )}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.enrollment._id} className="group flex flex-col overflow-hidden rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover">
                {course.course.thumbnailUrl ? (
                  <Link href={`/student/courses/${course.course.slug}`} className="relative block h-40 overflow-hidden">
                    <img
                      src={course.course.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      {getStatusBadge(course.status)}
                    </div>
                  </Link>
                ) : (
                  <div className="flex h-40 items-center justify-center border-b border-primary-100 bg-gradient-to-br from-primary-50 to-accent-50">
                    <BookOpen className="h-12 w-12 text-primary-400" aria-hidden="true" />
                  </div>
                )}
                <CardContent className="flex flex-col flex-1 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/student/courses/${course.course.slug}`}>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{course.course.name}</h3>
                    </Link>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                    {course.course.shortDescription ?? "No description available."}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                      {course.course.level}
                    </span>
                    {course.course.durationWeeks && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {course.course.durationWeeks} weeks
                      </span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Progress</span>
                      <span className="font-medium text-slate-900">{course.progressPercent}%</span>
                    </div>
                    <Progress value={course.progressPercent} className="mt-1.5 h-2" />
                    <p className="mt-1 text-xs text-slate-500">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </p>
                  </div>
                  <div className="mt-auto pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/student/courses/${course.course.slug}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        {course.status === "completed" ? "Review" : "Continue"} <ChevronRight className="h-4 w-4" />
                      </Link>
                      {getStatusBadge(course.status)}
                    </div>
                    {course.status === "completed" && certificateCourseIds.includes(course.course._id) ? (
                      <Link
                        href="/student/certificates"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 hover:text-amber-900"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Certificate Available
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border-primary-100">
            <CardContent className="py-12">
              <EmptyState
                icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
                title={currentFilter ? `No ${filters.find((f) => f.value === currentFilter)?.label.toLowerCase()} courses` : "No enrolled courses yet"}
                description={currentFilter
                  ? `You don't have any ${filters.find((f) => f.value === currentFilter)?.label.toLowerCase()} courses.`
                  : "Your enrolled courses will appear here once you enroll."}
                action={
                  !currentFilter && (
                    <Button asChild>
                      <Link href="/courses">Explore Courses</Link>
                    </Button>
                  )
                }
              />
            </CardContent>
          </Card>
        )}
      </div>
  );
}
