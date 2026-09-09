import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import { ProjectSubmission } from "@/models/ProjectSubmission";
import { Course } from "@/models/Course";
import { Internship } from "@/models/Internship";
import { User } from "@/models/User";
import { OfficeShell } from "@/components/office/OfficeShell";
import { serialize } from "@/lib/internships/service";
import { AdminProjectsClient } from "./AdminProjectsClient";

export const metadata: Metadata = {
  title: "Projects | Office",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const { user } = await requireAdmin();
  await connectDB();
  const [projects, submissions, courses, internships, students] =
    await Promise.all([
      Project.find()
        .populate("course", "name")
        .populate("internship", "title")
        .sort({ updatedAt: -1 })
        .lean(),
      ProjectSubmission.find().populate("student", "name email").lean(),
      Course.find({ status: { $ne: "archived" } })
        .select("name")
        .lean(),
      Internship.find({ status: { $ne: "archived" } })
        .select("title")
        .lean(),
      User.find({ role: "student", status: "active" })
        .select("name email")
        .lean(),
    ]);
  return (
    <OfficeShell session={user!}>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading projects…</p>}>
        <AdminProjectsClient
          data={serialize({
            projects,
            submissions,
            courses,
            internships,
            students,
          })}
        />
      </Suspense>
    </OfficeShell>
  );
}
