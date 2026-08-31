import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ContactRound,
  Mail,
  ShieldCheck,
  UserCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission } from "@/lib/auth/permissions";
import { connectDB } from "@/lib/db/connect";
import { PERMISSIONS, USER_ROLES } from "@/lib/constants";
import { Course } from "@/models/Course";
import { FacultyCourseAssignment } from "@/models/FacultyCourseAssignment";
import { User } from "@/models/User";

export const metadata: Metadata = {
  title: "Faculty — Office Portal",
  description: "Faculty directory and assigned course overview.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(value: Date | null | undefined) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function FacultyPage() {
  const { user } = await getValidatedSession();
  if (!user) redirect("/office/login?callbackUrl=/office/faculty");
  if (!canAccessOffice(user.role)) redirect("/student/dashboard");

  if (!hasPermission(user.role, PERMISSIONS.STAFF_READ)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg rounded-2xl border-primary-100">
          <CardHeader className="items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-100 text-accent-800">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <CardTitle>Faculty directory restricted</CardTitle>
            <CardDescription>Only authorized staff administrators can view faculty account information.</CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  await connectDB();
  const facultyDocs = await User.find({ role: USER_ROLES.FACULTY })
    .sort({ status: 1, name: 1 })
    .select("name email phone status avatarUrl employeeCode designation department lastOfficeLoginAt createdAt")
    .lean();

  const facultyIds = facultyDocs.map((member) => member._id);
  const assignmentDocs = facultyIds.length
    ? await FacultyCourseAssignment.find({ faculty: { $in: facultyIds } })
        .select("faculty course createdAt")
        .lean()
    : [];
  const courseIds = [...new Set(assignmentDocs.map((assignment) => assignment.course.toString()))];
  const courseDocs = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select("name status").lean()
    : [];
  const courseById = new Map(courseDocs.map((course) => [course._id.toString(), course]));

  const faculty = facultyDocs.map((member) => ({
    id: member._id.toString(),
    name: member.name,
    email: member.email,
    phone: member.phone,
    status: member.status,
    avatarUrl: member.avatarUrl,
    employeeCode: member.employeeCode,
    designation: member.designation,
    department: member.department,
    lastOfficeLoginAt: member.lastOfficeLoginAt,
    createdAt: member.createdAt,
    courses: assignmentDocs
      .filter((assignment) => assignment.faculty.toString() === member._id.toString())
      .map((assignment) => courseById.get(assignment.course.toString()))
      .filter((course): course is NonNullable<typeof course> => Boolean(course)),
  }));

  const activeCount = faculty.filter((member) => member.status === "active").length;
  const assignedCount = faculty.filter((member) => member.courses.length > 0).length;

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">People management</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Faculty</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Review faculty profiles, departments, account status and assigned teaching responsibilities.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-accent-200 bg-accent-100 px-3 py-2 text-sm font-semibold text-accent-900">
            <UsersRound className="h-4 w-4" aria-hidden="true" /> {faculty.length} faculty members
          </span>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Faculty overview">
          {[
            { label: "Total Faculty", value: faculty.length, icon: ContactRound, surface: "bg-primary-100", color: "text-primary-800" },
            { label: "Active Accounts", value: activeCount, icon: UserCheck, surface: "bg-emerald-50", color: "text-emerald-700" },
            { label: "With Courses", value: assignedCount, icon: BookOpen, surface: "bg-accent-100", color: "text-accent-800" },
            { label: "Unassigned", value: faculty.length - assignedCount, icon: UserRoundX, surface: "bg-primary-50", color: "text-primary-700" },
          ].map((metric) => (
            <Card key={metric.label} className="rounded-2xl border-primary-100">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.surface} ${metric.color}`}>
                  <metric.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-2xl font-bold tracking-tight text-slate-900">{metric.value}</p>
                  <p className="text-xs font-medium text-slate-500">{metric.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-gradient-to-r from-primary-50 to-accent-50">
            <CardTitle className="flex items-center gap-2"><ContactRound className="h-5 w-5 text-primary-700" aria-hidden="true" /> Faculty Directory</CardTitle>
            <CardDescription>Live staff records and course assignments</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {faculty.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ContactRound className="mx-auto h-12 w-12 text-primary-200" aria-hidden="true" />
                <h2 className="mt-4 font-semibold text-slate-900">No faculty accounts found</h2>
                <p className="mt-1 text-sm text-slate-500">Faculty members will appear here after their staff accounts are created.</p>
              </div>
            ) : (
              <div className="divide-y divide-primary-100">
                {faculty.map((member) => {
                  const initials = member.name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
                  return (
                    <article key={member.id} className="p-5 transition-colors hover:bg-primary-50/45 sm:p-6">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          {member.avatarUrl ? (
                            // Avatar URLs can come from the institute's configured media provider.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover ring-1 ring-primary-100" />
                          ) : (
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-sm font-bold text-primary-800">{initials}</span>
                          )}
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="font-semibold text-slate-900">{member.name}</h2>
                              <Badge variant={member.status === "active" ? "success" : member.status === "suspended" ? "danger" : "neutral"}>{member.status}</Badge>
                            </div>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Mail className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {member.email}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5"><BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden="true" /> {member.designation || "Faculty member"}</span>
                              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" aria-hidden="true" /> {member.department || "Department not set"}</span>
                              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Last login: {formatDate(member.lastOfficeLoginAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="lg:w-[22rem]">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">Assigned courses</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {member.courses.length ? member.courses.map((course) => (
                              <span key={course._id.toString()} className="rounded-full border border-primary-200 bg-white px-2.5 py-1 text-xs font-medium text-primary-800">{course.name}</span>
                            )) : <span className="text-sm text-slate-500">No courses assigned</span>}
                          </div>
                          <p className="mt-2 text-xs text-slate-400">Employee code: {member.employeeCode || "Not assigned"}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
