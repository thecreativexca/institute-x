import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { getEnrolledCourses } from "@/lib/student/dashboard";
import { getCertificatesForCourseIds } from "@/lib/certificates/queries";
import { StudentCoursesClient } from "./StudentCoursesClient";

export const metadata: Metadata = {
  title: "My Courses",
  description: "View and manage your enrolled courses.",
  robots: { index: false, follow: false },
};

export default async function StudentCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login?reauth=1");
  }

  const params = await searchParams;
  const courses = await getEnrolledCourses(student.id);

  const courseIds = courses.map((c) => c.course._id);
  const certificateCourseIds = await getCertificatesForCourseIds(student.id, courseIds);

  return (
    <StudentCoursesClient
      courses={courses}
      activeFilter={params.status}
      certificateCourseIds={[...certificateCourseIds]}
    />
  );
}
