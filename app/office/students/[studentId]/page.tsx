import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getStudentById, getStudentEnrollments, getStudentProgress, getStudentAssignments, getStudentQuizAttempts, getStudentPayments, getStudentCertificates, getStudentActivity } from "@/lib/office/students/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { ProfileTabsShell, ProfileTabsBar, ProfileTabPanel, DataTable, StatusBadge, ProgressBar, EmptyState, CollapsibleSection } from "@/components/office/students/StudentProfileUI";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { format } from "date-fns";
import Link from "next/link";
import { Types } from "mongoose";
import {
  User, Mail, Phone, Calendar, Shield, AlertCircle, CheckCircle, XCircle,
  GraduationCap, BookOpen, BarChart2, ClipboardList, HelpCircle, CreditCard,
  Award, Activity, ExternalLink, Edit2, MoreVertical, ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

interface StudentDetailPageProps {
  params: Promise<{ studentId: string }>;
}

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle, desc: "Student can access the portal" },
  inactive: { label: "Inactive", variant: "neutral" as const, icon: AlertCircle, desc: "Account is inactive" },
  suspended: { label: "Suspended", variant: "danger" as const, icon: XCircle, desc: "Portal access blocked" },
} as const;

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;

  if (!Types.ObjectId.isValid(studentId)) {
    notFound();
  }

  const { user } = await getValidatedSession();

  if (!user) {
    redirect(`/login?callbackUrl=/office/students/${studentId}`);
  }

  if (!canAccessOffice(user.role)) {
    notFound();
  }

  const canRead = hasPermission(user.role, PERMISSIONS.STUDENTS_READ);
  const canUpdate = hasPermission(user.role, PERMISSIONS.STUDENTS_UPDATE);
  const canManageStatus = hasPermission(user.role, PERMISSIONS.STUDENTS_STATUS);
  const canReadEnrollments = hasPermission(user.role, PERMISSIONS.ENROLLMENTS_READ);
  const canManageEnrollments = hasPermission(user.role, PERMISSIONS.ENROLLMENTS_MANAGE);
  const canReadPayments = hasPermission(user.role, PERMISSIONS.PAYMENTS_READ);
  const canReadCertificates = hasPermission(user.role, PERMISSIONS.CERTIFICATES_READ);
  const canReadAssignments = hasPermission(user.role, PERMISSIONS.ASSIGNMENTS_READ);
  const canReadQuizResults = hasPermission(user.role, PERMISSIONS.QUIZ_RESULTS_READ);

  if (!canRead) {
    notFound();
  }

  const [student, enrollments, progress, assignments, quizAttempts, payments, certificates, activity] = await Promise.all([
    getStudentById(studentId),
    canReadEnrollments ? getStudentEnrollments(studentId) : Promise.resolve([]),
    canReadEnrollments ? getStudentProgress(studentId) : Promise.resolve([]),
    canReadAssignments ? getStudentAssignments(studentId) : Promise.resolve([]),
    canReadQuizResults ? getStudentQuizAttempts(studentId) : Promise.resolve([]),
    canReadPayments ? getStudentPayments(studentId) : Promise.resolve([]),
    canReadCertificates ? getStudentCertificates(studentId) : Promise.resolve([]),
    getStudentActivity(studentId),
  ]);

  if (!student) {
    notFound();
  }

  const statusCfg = statusConfig[student.status];
  const isEmailVerified = !!student.emailVerifiedAt;

  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="h-4 w-4" /> },
    { id: "enrollments", label: "Enrollments", icon: <GraduationCap className="h-4 w-4" />, disabled: !canReadEnrollments },
    { id: "progress", label: "Progress", icon: <BarChart2 className="h-4 w-4" />, disabled: !canReadEnrollments },
    { id: "assignments", label: "Assignments", icon: <ClipboardList className="h-4 w-4" />, disabled: !canReadAssignments },
    { id: "quizzes", label: "Quizzes", icon: <HelpCircle className="h-4 w-4" />, disabled: !canReadQuizResults },
    { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" />, disabled: !canReadPayments },
    { id: "certificates", label: "Certificates", icon: <Award className="h-4 w-4" />, disabled: !canReadCertificates },
    { id: "activity", label: "Activity", icon: <Activity className="h-4 w-4" /> },
  ].filter((t) => !t.disabled);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2" aria-label="Breadcrumb">
              <Link href="/office" className="hover:text-slate-700">Office</Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <Link href="/office/students" className="hover:text-slate-700">Students</Link>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
              <span className="text-slate-900 font-medium truncate max-w-[200px]">{student.name}</span>
            </nav>
            <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{student.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {(canUpdate || canManageStatus) && (
              <div className="relative">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="More actions">
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </header>

        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Avatar className="h-24 w-24 shrink-0">
                <AvatarImage src={student.avatarUrl || undefined} alt={student.name} />
                <AvatarFallback className="text-2xl font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusCfg.variant} className="gap-1.5 text-sm">
                    <statusCfg.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {statusCfg.label}
                  </Badge>
                  <Badge variant={isEmailVerified ? "success" : "secondary"} className="gap-1.5 text-sm">
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    {isEmailVerified ? "Email Verified" : "Email Unverified"}
                  </Badge>
                  {(canUpdate || canManageStatus) && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/office/students/${studentId}/edit`}>
                        <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
                        Edit Profile
                      </Link>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Email</p>
                    <p className="font-medium text-slate-900">{student.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Phone</p>
                    <p className="font-medium text-slate-900">{student.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Joined</p>
                    <p className="font-medium text-slate-900">{format(new Date(student.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Last Login</p>
                    <p className="font-medium text-slate-900">
                      {student.lastLoginAt ? format(new Date(student.lastLoginAt), "MMM d, yyyy HH:mm") : "Never"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{student.enrollmentCounts.total}</p>
                    <p className="text-sm text-slate-500">Total Enrollments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">{student.enrollmentCounts.active}</p>
                    <p className="text-sm text-slate-500">Active Courses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-700">{student.enrollmentCounts.completed}</p>
                    <p className="text-sm text-slate-500">Completed Courses</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <ProfileTabsShell tabs={tabs} className="mt-6">
          <ProfileTabsBar tabs={tabs} />

        <ProfileTabPanel id="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" aria-hidden="true" />
                  Account Information
                </CardTitle>
                <CardDescription>Basic account details and verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <dt className="text-sm text-slate-500">Full Name</dt>
                    <dd className="mt-1 font-medium text-slate-900">{student.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Email</dt>
                    <dd className="mt-1 font-medium text-slate-900">{student.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Phone</dt>
                    <dd className="mt-1 font-medium text-slate-900">{student.phone || "Not provided"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Account Status</dt>
                    <dd className="mt-1">
                      <Badge variant={statusCfg.variant} className="gap-1">
                        <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                        {statusCfg.label}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Email Verification</dt>
                    <dd className="mt-1">
                      <Badge variant={isEmailVerified ? "success" : "secondary"} className="gap-1">
                        <Shield className="h-3 w-3" aria-hidden="true" />
                        {isEmailVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Verified At</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {student.emailVerifiedAt ? format(new Date(student.emailVerifiedAt), "MMM d, yyyy HH:mm") : "Not verified"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Account Created</dt>
                    <dd className="mt-1 font-medium text-slate-900">{format(new Date(student.createdAt), "MMM d, yyyy HH:mm")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Last Portal Login</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {student.lastLoginAt ? format(new Date(student.lastLoginAt), "MMM d, yyyy HH:mm") : "Never"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-slate-500">Last Office Login</dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {student.lastOfficeLoginAt ? format(new Date(student.lastOfficeLoginAt), "MMM d, yyyy HH:mm") : "Never"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                  Enrollment Summary
                </CardTitle>
                <CardDescription>Quick overview of student&apos;s course enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-slate-50">
                    <p className="text-3xl font-bold text-slate-900">{student.enrollmentCounts.total}</p>
                    <p className="text-sm text-slate-500">Total Courses</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-primary-50">
                    <p className="text-3xl font-bold text-primary-600">{student.enrollmentCounts.active}</p>
                    <p className="text-sm text-slate-500">In Progress</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-amber-50">
                    <p className="text-3xl font-bold text-amber-700">{student.enrollmentCounts.completed}</p>
                    <p className="text-sm text-slate-500">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="enrollments">
          <div className="space-y-6">
            <CollapsibleSection title="Course Enrollments" icon={<GraduationCap className="h-5 w-5" />}>
              {enrollments.length === 0 ? (
                <EmptyState
                  icon={<GraduationCap className="h-12 w-12" />}
                  title="No enrollments"
                  description="This student is not enrolled in any courses yet."
                  action={
                    <Button variant="outline" asChild>
                      <Link href={`/office/students/${studentId}/enroll`}>
                        Enroll in Course
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <DataTable
                  columns={[
                    { key: "course", header: "Course", render: (e) => (
                      <Link href={`/office/courses/${e.courseId}`} className="font-medium text-primary-600 hover:underline">
                        {e.courseName}
                      </Link>
                    )},
                    { key: "status", header: "Status", render: (e) => (
                      <StatusBadge
                        status={e.status}
                        variants={{ active: "success", completed: "default", pending: "warning", cancelled: "danger", expired: "secondary" }}
                        labels={{ active: "Active", completed: "Completed", pending: "Pending", cancelled: "Cancelled", expired: "Expired" }}
                      />
                    )},
                    { key: "payment", header: "Payment", render: (e) => (
                      <StatusBadge
                        status={e.paymentStatus}
                        variants={{ paid: "success", pending: "warning", failed: "danger", refunded: "secondary", created: "default" }}
                      />
                    )},
                    { key: "progress", header: "Progress", render: (e) => (
                      <div className="flex items-center gap-3 w-[200px]">
                        <ProgressBar value={e.progressPercent} max={100} showPercentage />
                        <span className="text-sm text-slate-500">{e.completedLessons}/{e.totalLessons}</span>
                      </div>
                    )},
                    { key: "enrolled", header: "Enrolled", render: (e) => format(new Date(e.enrolledAt), "MMM d, yyyy") },
                    { key: "completed", header: "Completed", render: (e) => e.completedAt ? format(new Date(e.completedAt), "MMM d, yyyy") : "—" },
                  ]}
                  data={enrollments}
                  keyExtractor={(e) => e.id}
                  emptyIcon={<GraduationCap className="h-12 w-12" />}
                />
              )}
            </CollapsibleSection>

            {canManageEnrollments && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" aria-hidden="true" />
                    Manual Enrollment
                  </CardTitle>
                  <CardDescription>Enroll this student in a course directly</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">Manual enrollment functionality will be implemented here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="progress">
          <div className="space-y-6">
            {progress.length === 0 ? (
              <EmptyState
                icon={<BarChart2 className="h-12 w-12" />}
                title="No progress data"
                description="This student has no active course progress to display."
              />
            ) : (
              progress.map((courseProgress) => (
                <CollapsibleSection key={courseProgress.courseId} title={courseProgress.courseName} icon={<BookOpen className="h-5 w-5" />}>
                  <div className="space-y-4">
                    <ProgressBar value={courseProgress.progressPercent} max={100} label="Overall Course Progress" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <p className="text-xl font-bold text-slate-900">{courseProgress.completedLessons}</p>
                        <p className="text-slate-500">Completed Lessons</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <p className="text-xl font-bold text-slate-900">{courseProgress.totalLessons}</p>
                        <p className="text-slate-500">Total Lessons</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-slate-50">
                        <p className="text-xl font-bold text-primary-600">{courseProgress.progressPercent}%</p>
                        <p className="text-slate-500">Completion</p>
                      </div>
                    </div>

                    <h4 className="font-medium text-slate-900">Module Progress</h4>
                    <DataTable
                      columns={[
                        { key: "module", header: "Module", render: (m) => m.moduleTitle },
                        { key: "completed", header: "Completed", render: (m) => m.completedLessons },
                        { key: "total", header: "Total", render: (m) => m.totalLessons },
                        { key: "percent", header: "Progress", render: (m) => (
                          <ProgressBar value={m.percent} max={100} showPercentage />
                        )},
                        { key: "status", header: "Status", render: (m) => (
                          <StatusBadge
                            status={m.status}
                            variants={{ completed: "success", in_progress: "warning", not_started: "secondary" }}
                          />
                        )},
                      ]}
                      data={courseProgress.moduleProgress}
                      keyExtractor={(m) => m.moduleId}
                      emptyIcon={<BookOpen className="h-12 w-12" />}
                    />
                  </div>
                </CollapsibleSection>
              ))
            )}
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="assignments">
          <div className="space-y-6">
            {assignments.length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-12 w-12" />}
                title="No assignment submissions"
                description="This student has not submitted any assignments yet."
              />
            ) : (
              <CollapsibleSection title="Assignment Submissions" icon={<ClipboardList className="h-5 w-5" />}>
                <DataTable
                  columns={[
                    { key: "assignment", header: "Assignment", render: (a) => (
                      <div>
                        <p className="font-medium text-slate-900">{a.assignmentTitle}</p>
                        <p className="text-sm text-slate-500">{a.courseName}</p>
                      </div>
                    )},
                    { key: "submitted", header: "Submitted", render: (a) => format(new Date(a.submittedAt), "MMM d, yyyy HH:mm") },
                    { key: "status", header: "Status", render: (a) => (
                      <StatusBadge
                        status={a.status}
                        variants={{ submitted: "warning", graded: "success" }}
                      />
                    )},
                    { key: "score", header: "Score", render: (a) => a.score !== null ? `${a.score}/${a.maxScore}` : "—" },
                    { key: "percentage", header: "Percentage", render: (a) => a.score !== null ? `${Math.round((a.score / a.maxScore) * 100)}%` : "—" },
                    { key: "late", header: "Late", render: (a) => a.isLate ? (
                      <Badge variant="danger">Yes</Badge>
                    ) : (
                      <Badge variant="primary">No</Badge>
                    )},
                    { key: "feedback", header: "Feedback", render: (a) => a.feedback ? (
                      <Badge variant="success">Yes</Badge>
                    ) : (
                      <Badge variant="primary">No</Badge>
                    )},
                  ]}
                  data={assignments}
                  keyExtractor={(a) => a.id}
                  emptyIcon={<ClipboardList className="h-12 w-12" />}
                />
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Assignment Summary" icon={<ClipboardList className="h-5 w-5" />} defaultOpen={false}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-50">
                  <p className="text-2xl font-bold text-slate-900">{assignments.length}</p>
                  <p className="text-sm text-slate-500">Total Submissions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-700">{assignments.filter(a => a.status === "graded").length}</p>
                  <p className="text-sm text-slate-500">Graded</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-600">{assignments.filter(a => a.status === "submitted").length}</p>
                  <p className="text-sm text-slate-500">Pending Grade</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{assignments.filter(a => a.isLate).length}</p>
                  <p className="text-sm text-slate-500">Late Submissions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-50">
                  <p className="text-2xl font-bold text-primary-600">
                    {assignments.length > 0
                      ? Math.round(assignments.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score ?? 0) / a.maxScore * 100, 0) / assignments.filter(a => a.score !== null).length)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Avg Score</p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="quizzes">
          <div className="space-y-6">
            {quizAttempts.length === 0 ? (
              <EmptyState
                icon={<HelpCircle className="h-12 w-12" />}
                title="No quiz attempts"
                description="This student has not attempted any quizzes yet."
              />
            ) : (
              <CollapsibleSection title="Quiz Attempts" icon={<HelpCircle className="h-5 w-5" />}>
                <DataTable
                  columns={[
                    { key: "quiz", header: "Quiz", render: (q) => (
                      <div>
                        <p className="font-medium text-slate-900">{q.quizTitle}</p>
                        <p className="text-sm text-slate-500">{q.courseName}</p>
                      </div>
                    )},
                    { key: "attempt", header: "Attempt", render: (q) => `#${q.attemptNumber}` },
                    { key: "started", header: "Started", render: (q) => format(new Date(q.startedAt), "MMM d, yyyy HH:mm") },
                    { key: "submitted", header: "Submitted", render: (q) => q.submittedAt ? format(new Date(q.submittedAt), "MMM d, yyyy HH:mm") : "In progress" },
                    { key: "status", header: "Status", render: (q) => (
                      <StatusBadge
                        status={q.status}
                        variants={{ submitted: "success", in_progress: "warning", expired: "secondary" }}
                      />
                    )},
                    { key: "score", header: "Score", render: (q) => `${q.score}/${q.totalMarks}` },
                    { key: "percentage", header: "%", render: (q) => `${q.percentage}%` },
                    { key: "passed", header: "Result", render: (q) => (
                      <Badge variant={q.passed ? "success" : "danger"}>
                        {q.passed ? "Passed" : "Failed"}
                      </Badge>
                    )},
                  ]}
                  data={quizAttempts}
                  keyExtractor={(q) => q.id}
                  emptyIcon={<HelpCircle className="h-12 w-12" />}
                />
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Quiz Summary" icon={<HelpCircle className="h-5 w-5" />} defaultOpen={false}>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-50">
                  <p className="text-2xl font-bold text-slate-900">{quizAttempts.length}</p>
                  <p className="text-sm text-slate-500">Total Attempts</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-700">{quizAttempts.filter(q => q.passed).length}</p>
                  <p className="text-sm text-slate-500">Passed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{quizAttempts.filter(q => !q.passed && q.status === "submitted").length}</p>
                  <p className="text-sm text-slate-500">Failed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-600">{quizAttempts.filter(q => q.status === "in_progress").length}</p>
                  <p className="text-sm text-slate-500">In Progress</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary-50">
                  <p className="text-2xl font-bold text-primary-600">
                    {quizAttempts.length > 0
                      ? Math.round(quizAttempts.reduce((sum, q) => sum + q.percentage, 0) / quizAttempts.length)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-500">Avg Score</p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="payments">
          <div className="space-y-6">
            {payments.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-12 w-12" />}
                title="No payments"
                description="This student has not made any payments yet."
              />
            ) : (
              <CollapsibleSection title="Payment History" icon={<CreditCard className="h-5 w-5" />}>
                <DataTable
                  columns={[
                    { key: "course", header: "Course", render: (p) => p.courseName },
                    { key: "amount", header: "Amount", render: (p) => `${p.currency} ${p.amount.toLocaleString()}` },
                    { key: "provider", header: "Provider", render: (p) => p.provider.toUpperCase() },
                    { key: "receipt", header: "Receipt", render: (p) => (
                      <code className="text-sm font-mono text-slate-600">{p.receiptNumber}</code>
                    )},
                    { key: "status", header: "Status", render: (p) => (
                      <StatusBadge
                        status={p.status}
                        variants={{ paid: "success", pending: "warning", failed: "danger", refunded: "secondary", created: "default" }}
                      />
                    )},
                    { key: "date", header: "Date", render: (p) => format(new Date(p.paidAt || p.createdAt), "MMM d, yyyy HH:mm") },
                  ]}
                  data={payments}
                  keyExtractor={(p) => p.id}
                  emptyIcon={<CreditCard className="h-12 w-12" />}
                />
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Payment Summary" icon={<CreditCard className="h-5 w-5" />} defaultOpen={false}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-slate-50">
                  <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
                  <p className="text-sm text-slate-500">Total Transactions</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-700">₹{payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Successful Amount</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-red-600">{payments.filter(p => p.status === "failed").length}</p>
                  <p className="text-sm text-slate-500">Failed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-amber-50">
                  <p className="text-2xl font-bold text-amber-600">{payments.filter(p => p.status === "pending").length}</p>
                  <p className="text-sm text-slate-500">Pending</p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="certificates">
          <div className="space-y-6">
            {certificates.length === 0 ? (
              <EmptyState
                icon={<Award className="h-12 w-12" />}
                title="No certificates"
                description="This student has not earned any certificates yet."
              />
            ) : (
              <CollapsibleSection title="Certificates Earned" icon={<Award className="h-5 w-5" />}>
                <DataTable
                  columns={[
                    { key: "certNumber", header: "Certificate #", render: (c) => (
                      <code className="font-mono text-sm text-slate-900">{c.certificateNumber}</code>
                    )},
                    { key: "course", header: "Course", render: (c) => c.courseName },
                    { key: "issued", header: "Issued", render: (c) => format(new Date(c.issuedAt), "MMM d, yyyy") },
                    { key: "completed", header: "Completed", render: (c) => (c.completionDate ? format(new Date(c.completionDate), "MMM d, yyyy") : "—") },
                    { key: "status", header: "Status", render: (c) => (
                      <StatusBadge
                        status={c.status}
                        variants={{ issued: "success", revoked: "danger" }}
                      />
                    )},
                    { key: "verification", header: "Verify", render: (c) => (
                      <Link href={`/verify-certificate/${c.verificationCode}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline text-sm">
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                        View
                      </Link>
                    )},
                  ]}
                  data={certificates}
                  keyExtractor={(c) => c.id}
                  emptyIcon={<Award className="h-12 w-12" />}
                />
              </CollapsibleSection>
            )}
          </div>
        </ProfileTabPanel>

        <ProfileTabPanel id="activity">
          <div className="space-y-6">
            {activity.length === 0 ? (
              <EmptyState
                icon={<Activity className="h-12 w-12" />}
                title="No activity"
                description="No recent activity recorded for this student."
              />
            ) : (
              <CollapsibleSection title="Recent Activity" icon={<Activity className="h-5 w-5" />} defaultOpen={true}>
                <ul className="divide-y divide-slate-200" role="list">
                  {activity.map((event) => (
                    <li key={event.id} className="py-4 flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        {getActivityIcon(event.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900">{event.description}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {format(new Date(event.timestamp), "MMM d, yyyy HH:mm")}
                          {event.courseName && ` · ${event.courseName}`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}
          </div>
        </ProfileTabPanel>
        </ProfileTabsShell>
      </div>
    </OfficeShell>
  );
}

function getActivityIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    account_created: <User className="h-5 w-5" />,
    enrollment_created: <GraduationCap className="h-5 w-5" />,
    lesson_completed: <BookOpen className="h-5 w-5" />,
    assignment_submitted: <ClipboardList className="h-5 w-5" />,
    quiz_completed: <HelpCircle className="h-5 w-5" />,
    payment_completed: <CreditCard className="h-5 w-5" />,
    course_completed: <Award className="h-5 w-5" />,
    certificate_issued: <Award className="h-5 w-5" />,
    status_changed: <AlertCircle className="h-5 w-5" />,
  };
  return icons[type] || <Activity className="h-5 w-5" />;
}