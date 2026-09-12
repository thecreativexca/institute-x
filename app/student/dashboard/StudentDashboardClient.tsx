"use client";

import Link from "next/link";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import {
  BookOpen,
  Award,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  Clock as ClockIcon,
  FileText,
  HelpCircle,
  Mail,
  GraduationCap,
  User,
} from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  href: string;
  iconSurface: string;
  iconColor: string;
}

interface EnrolledCourse {
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

interface RecentActivity {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  completedAt: string;
  status: "completed" | "in_progress";
}

interface PendingTask {
  id: string;
  type: "assignment" | "quiz";
  courseId: string;
  courseTitle: string;
  title: string;
  dueAt: string | null;
  status: "pending" | "overdue";
}

interface AnnouncementItem {
  id: string;
  title: string;
  body: string;
  publishedAt: string | null;
  read: boolean;
}

interface CertificatePreview {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  issuedAt: string;
  status: "issued" | "revoked";
}

interface StudentProfilePreview {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  emailVerifiedAt: string | null;
}

interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  overallProgress: number;
  certificates: number;
}

interface StudentDashboardClientProps {
  session: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  stats: DashboardStats;
  enrolledCourses: EnrolledCourse[];
  recentActivity: RecentActivity[];
  pendingTasks: PendingTask[];
  announcements: AnnouncementItem[];
  certificates: CertificatePreview[];
  profile: StudentProfilePreview | null;
  career: { enrollment?: { internship: { _id: string; title: string }; progressPercentage: number } | null; activeProjects: number };
}

const statItems: StatItem[] = [
  { label: "Enrolled Courses", value: 0, icon: BookOpen, href: "/student/courses", iconSurface: "bg-primary-100", iconColor: "text-primary-700" },
  { label: "Completed Courses", value: 0, icon: Award, href: "/student/courses?status=completed", iconSurface: "bg-accent-100", iconColor: "text-accent-800" },
  { label: "Overall Progress", value: "0%", icon: TrendingUp, href: "/student/progress", iconSurface: "bg-primary-50", iconColor: "text-primary-600" },
  { label: "Certificates", value: 0, icon: GraduationCap, href: "/student/certificates", iconSurface: "bg-accent-50", iconColor: "text-accent-700" },
];

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch {
    return "—";
  }
}

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  } catch {
    return "—";
  }
}

function getStatusBadge(status: EnrolledCourse["status"]) {
  switch (status) {
    case "completed":
      return <Badge variant="success">Completed</Badge>;
    case "in_progress":
      return <Badge variant="primary">In Progress</Badge>;
    default:
      return <Badge variant="neutral">Not Started</Badge>;
  }
}

function getTaskStatusBadge(status: PendingTask["status"]) {
  return status === "overdue"
    ? <Badge variant="danger">Overdue</Badge>
    : <Badge variant="warning">Pending</Badge>;
}

export function StudentDashboardClient({
  session,
  stats,
  enrolledCourses,
  recentActivity,
  pendingTasks,
  announcements,
  certificates,
  profile,
  career,
}: StudentDashboardClientProps) {
  const statsWithValues = [
    { ...statItems[0], value: stats.enrolledCourses },
    { ...statItems[1], value: stats.completedCourses },
    { ...statItems[2], value: `${stats.overallProgress}%` },
    { ...statItems[3], value: stats.certificates },
  ];

  const inProgressCourses = enrolledCourses.filter((c) => c.status === "in_progress");
  const notStartedCourses = enrolledCourses.filter((c) => c.status === "not_started");
  const completedCourses = enrolledCourses.filter((c) => c.status === "completed");

  return (
    <div className="space-y-7">
        {/* Welcome Section */}
        <section className="relative overflow-hidden rounded-[1.75rem] border border-primary-900 bg-[#103a50] px-6 py-7 text-white shadow-2xl shadow-primary-950/15 sm:px-8 sm:py-9">
          <div aria-hidden="true" className="student-grid-pattern absolute inset-0 opacity-55" />
          <div aria-hidden="true" className="absolute -right-14 -top-20 h-64 w-64 rounded-full bg-accent-300/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent-200/30 bg-accent-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-200">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" /> My learning dashboard
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {session.name}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-primary-100 sm:text-base">
                Continue from where you stopped, complete pending work and keep moving toward your next certificate.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-primary-100">
                <span className="rounded-full bg-white/[0.08] px-3 py-1.5">{inProgressCourses.length} courses in progress</span>
                <span className="rounded-full bg-white/[0.08] px-3 py-1.5">{pendingTasks.length} pending tasks</span>
              </div>
            </div>
            <Button asChild className="h-11 shrink-0 border border-accent-200 bg-accent-300 px-5 font-semibold text-primary-950 shadow-lg shadow-primary-950/25 hover:bg-accent-200">
              <Link href="/courses">Explore Courses <ChevronRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {(career.enrollment || career.activeProjects > 0) && (
          <Card className="border-accent-200 bg-accent-50/50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-primary-600">Career experience</p><h2 className="mt-1 font-semibold text-slate-900">{career.enrollment?.internship?.title ?? `${career.activeProjects} active project${career.activeProjects === 1 ? "" : "s"}`}</h2><p className="mt-1 text-sm text-slate-600">{career.enrollment ? `${career.enrollment.progressPercentage}% internship progress` : "Continue your assigned practical projects."}</p></div><Button asChild><Link href={career.enrollment ? `/student/internships/${career.enrollment.internship._id}` : "/student/projects"}>Continue <ChevronRight className="h-4 w-4" /></Link></Button></CardContent></Card>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsWithValues.map((stat) => (
            <Card key={stat.label} className="group overflow-hidden rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover">
              <CardContent className="p-5 sm:p-5">
                <div className="flex items-center gap-3.5">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.iconSurface)}>
                    <stat.icon className={cn("h-5 w-5", stat.iconColor)} aria-hidden={true} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                    <p className="truncate text-xs font-medium text-slate-500">{stat.label}</p>
                  </div>
                </div>
                <Link href={stat.href} className="mt-4 flex items-center justify-between border-t border-primary-50 pt-3 text-xs font-semibold text-primary-700 transition-colors hover:text-primary-900">
                  View details <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Learning */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </div>
                {inProgressCourses.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/courses?status=in_progress">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {inProgressCourses.length > 0 ? (
                <div className="space-y-4">
                  {inProgressCourses.slice(0, 3).map((course) => (
                    <Link
                      key={course.enrollment._id}
                      href={`/student/courses/${course.course.slug}`}
                      className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      {course.course.thumbnailUrl ? (
                        <img
                          src={course.course.thumbnailUrl}
                          alt=""
                          className="h-16 w-24 rounded-lg object-cover bg-slate-100"
                        />
                      ) : (
                        <div className="h-16 w-24 rounded-lg bg-primary-100 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-primary-400" aria-hidden="true" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 truncate">{course.course.name}</h4>
                        <p className="text-sm text-slate-500">{course.course.level}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={course.progressPercent} className="flex-1 max-w-xs h-2" />
                          <span className="text-sm font-medium text-slate-700 w-10 text-right">
                            {course.progressPercent}%
                          </span>
                        </div>
                        {course.currentLesson && (
                          <p className="mt-1 text-xs text-slate-500 truncate">
                            {course.currentLesson.moduleTitle} › {course.currentLesson.title}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="primary" className="shrink-0">
                        {course.status === "in_progress" ? "Continue" : "Start"}
                      </Button>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
                  title="No courses in progress"
                  description="Enroll in a course to start learning and track your progress here."
                  action={
                    <Button asChild>
                      <Link href="/courses">Browse Courses</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* My Courses Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>All your enrolled courses</CardDescription>
                </div>
                {enrolledCourses.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/courses">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {enrolledCourses.length > 0 ? (
                <div className="space-y-3">
                  {[...inProgressCourses, ...notStartedCourses, ...completedCourses]
                    .slice(0, 4)
                    .map((course) => (
                      <Link
                        key={course.enrollment._id}
                        href={`/student/courses/${course.course.slug}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                      >
                        {course.course.thumbnailUrl ? (
                          <img
                            src={course.course.thumbnailUrl}
                            alt=""
                            className="h-14 w-20 rounded-lg object-cover bg-slate-100"
                          />
                        ) : (
                          <div className="h-14 w-20 rounded-lg bg-primary-100 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-primary-400" aria-hidden="true" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">{course.course.name}</h4>
                          <p className="text-sm text-slate-500">{course.course.level}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="neutral">{course.course.durationWeeks ? `${course.course.durationWeeks} weeks` : "Self-paced"}</Badge>
                            {getStatusBadge(course.status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-700">{course.progressPercent}%</p>
                          <Progress value={course.progressPercent} className="w-32 h-1.5 mt-1" />
                        </div>
                      </Link>
                    ))}
                  {enrolledCourses.length > 4 && (
                    <Button asChild variant="ghost" size="sm" className="w-full mt-2">
                      <Link href="/student/courses">View all {enrolledCourses.length} courses <ChevronRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<BookOpen className="h-12 w-12" aria-hidden="true" />}
                  title="No enrolled courses yet"
                  description="Your enrolled courses will appear here once you enroll."
                  action={
                    <Button asChild>
                      <Link href="/courses">Explore Courses</Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Learning Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Learning Activity</CardTitle>
                  <CardDescription>Your latest lesson progress</CardDescription>
                </div>
                {recentActivity.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/progress">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div
                      key={activity.lessonId}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                          activity.status === "completed"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-primary-100 text-primary-600"
                        )}
                      >
                        {activity.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ClockIcon className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{activity.lessonTitle}</p>
                        <p className="text-sm text-slate-500 truncate">
                          {activity.courseTitle} › {activity.moduleTitle}
                        </p>
                        <p className="text-xs text-slate-400">{formatDateTime(activity.completedAt)}</p>
                      </div>
                      <Badge variant={activity.status === "completed" ? "success" : "primary"}>
                        {activity.status === "completed" ? "Completed" : "In Progress"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<ClockIcon className="h-12 w-12" aria-hidden="true" />}
                  title="No learning activity yet"
                  description="Your recent lessons will appear here once you start learning."
                />
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending Tasks</CardTitle>
                  <CardDescription>Assignments and quizzes requiring attention</CardDescription>
                </div>
                {pendingTasks.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/assignments">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  {pendingTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                          task.type === "assignment"
                            ? "bg-accent-100 text-accent-600"
                            : "bg-primary-100 text-primary-600"
                        )}
                      >
                        {task.type === "assignment" ? (
                          <FileText className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <HelpCircle className="h-4 w-4" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{task.title}</p>
                        <p className="text-sm text-slate-500 truncate">{task.courseTitle}</p>
                        {task.dueAt && (
                          <p className="text-xs text-slate-400">
                            Due: {formatDate(task.dueAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.type === "assignment" ? "warning" : "primary"}>
                          {task.type === "assignment" ? "Assignment" : "Quiz"}
                        </Badge>
                        {getTaskStatusBadge(task.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<FileText className="h-12 w-12" aria-hidden="true" />}
                  title="No pending tasks"
                  description="Assignments and quizzes will appear here when available."
                />
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Latest Announcements</CardTitle>
                  <CardDescription>Updates from your instructors</CardDescription>
                </div>
                {announcements.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/support">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        announcement.read ? "border-slate-200" : "border-primary-200 bg-primary-50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900">{announcement.title}</h4>
                          <p className="mt-1 text-sm text-slate-600 line-clamp-2">{announcement.body}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            {announcement.publishedAt ? formatDate(announcement.publishedAt) : "Recent"}
                          </p>
                        </div>
                        {!announcement.read && (
                          <span className="flex h-2 w-2 shrink-0 mt-1.5 rounded-full bg-primary-600" aria-label="Unread" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<Mail className="h-12 w-12" aria-hidden="true" />}
                  title="No new announcements"
                  description="Announcements from your instructors will appear here."
                />
              )}
            </CardContent>
          </Card>

          {/* Certificates */}
          {certificates.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/60">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                    <Award className="h-5 w-5 text-amber-800" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Certificates
                    </p>
                    <p className="text-sm text-slate-600">
                      {certificates.length} certificate{certificates.length > 1 ? "s" : ""} available
                    </p>
                  </div>
                </div>
                <Button asChild variant="primary" size="sm">
                  <Link href="/student/certificates">View Certificates <ChevronRight className="h-4 w-4 ml-1" /></Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Certificates</CardTitle>
                  <CardDescription>Your earned certificates</CardDescription>
                </div>
                {certificates.length > 0 && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/student/certificates">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {certificates.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {certificates.slice(0, 4).map((cert) => (
                    <Link
                      key={cert.id}
                      href={`/student/certificates/${cert.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                        <Award className="h-6 w-6 text-amber-700" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">{cert.courseTitle}</p>
                        <p className="text-sm text-slate-500">{cert.certificateNumber}</p>
                        <p className="text-xs text-slate-400">Issued {formatDate(cert.issuedAt)}</p>
                      </div>
                      {cert.status === "revoked" ? (
                        <Badge variant="danger">Revoked</Badge>
                      ) : (
                        <Badge variant="success">Valid</Badge>
                      )}
                    </Link>
                  ))}
                  {certificates.length > 4 && (
                    <Button asChild variant="ghost" size="sm" className="sm:col-span-2">
                      <Link href="/student/certificates">View all {certificates.length} certificates <ChevronRight className="h-4 w-4 ml-1" /></Link>
                    </Button>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<Award className="h-12 w-12" aria-hidden="true" />}
                  title="No certificates issued yet."
                  description="Your certificates will appear here once they are issued by the institute."
                />
              )}
            </CardContent>
          </Card>

          {/* Profile Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Account information</CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile.avatarUrl ?? ""} alt={profile.name} />
                    <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold text-slate-900 truncate">{profile.name}</p>
                    <p className="text-sm text-slate-500 truncate">{profile.email}</p>
                    {profile.phone && (
                      <p className="text-sm text-slate-500 truncate">{profile.phone}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant={profile.emailVerifiedAt ? "success" : "warning"}>
                        {profile.emailVerifiedAt ? "Email verified" : "Email not verified"}
                      </Badge>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/student/profile">Edit Profile <ChevronRight className="h-4 w-4 ml-1" /></Link>
                  </Button>
                </div>
              ) : (
                <EmptyState
                  icon={<User className="h-12 w-12" aria-hidden="true" />}
                  title="Profile unavailable"
                  description="Unable to load profile information."
                />
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
