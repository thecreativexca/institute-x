import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { getDashboardStats, getEnrolledCourses, getRecentActivity, getPendingTasks, getAnnouncements, getCertificates, getStudentProfile } from "@/lib/student/dashboard";
import { listCertificateEligibleEnrollments } from "@/lib/certificates/issue";
import { StudentDashboardClient } from "./StudentDashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Student dashboard - track your learning progress.",
  robots: { index: false, follow: false },
};

export default async function StudentDashboardPage() {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  const [stats, enrolledCourses, recentActivity, pendingTasks, announcements, certificates, profile] = await Promise.all([
    getDashboardStats(student.id),
    getEnrolledCourses(student.id),
    getRecentActivity(student.id),
    getPendingTasks(student.id),
    getAnnouncements(student.id),
    getCertificates(student.id),
    getStudentProfile(student.id),
  ]);

  const certificatesReady = await listCertificateEligibleEnrollments(student.id);

  return (
    <StudentDashboardClient
      session={{
        id: student.id,
        name: student.name,
        email: student.email,
        role: student.role,
      }}
      stats={stats}
      enrolledCourses={enrolledCourses}
      recentActivity={recentActivity}
      pendingTasks={pendingTasks}
      announcements={announcements}
      certificates={certificates}
      profile={profile}
      certificatesReadyCount={certificatesReady.length}
    />
  );
}
