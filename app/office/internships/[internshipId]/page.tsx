import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Internship } from "@/models/Internship";
import { InternshipApplication } from "@/models/InternshipApplication";
import { InternshipEnrollment } from "@/models/InternshipEnrollment";
import { InternshipTask } from "@/models/InternshipTask";
import { InternshipTaskSubmission } from "@/models/InternshipTaskSubmission";
import { InternshipMilestone } from "@/models/InternshipMilestone";
import { InternshipEvaluation } from "@/models/InternshipEvaluation";
import { Project } from "@/models/Project";
import { ProjectSubmission } from "@/models/ProjectSubmission";
import { User } from "@/models/User";
import { OfficeShell } from "@/components/office/OfficeShell";
import { serialize, objectId } from "@/lib/internships/service";
import { InternshipAdminDetail } from "./InternshipAdminDetail";
export default async function Page({
  params,
}: PageProps<"/office/internships/[internshipId]">) {
  const { user } = await requireAdmin(),
    { internshipId } = await params;
  await connectDB();
  let iid;
  try {
    iid = objectId(internshipId);
  } catch {
    notFound();
  }
  const internship = await Internship.findById(iid)
    .populate("eligibleCourses", "name")
    .lean();
  if (!internship) notFound();
  const [
    applications,
    enrollments,
    tasks,
    taskSubs,
    projects,
    projectSubs,
    milestones,
    evaluations,
    students,
  ] = await Promise.all([
    InternshipApplication.find({ internship: iid })
      .populate("student", "name email")
      .sort({ appliedAt: -1 })
      .lean(),
    InternshipEnrollment.find({ internship: iid, status: { $ne: "removed" } })
      .populate("student", "name email")
      .lean(),
    InternshipTask.find({ internship: iid }).sort({ sortOrder: 1 }).lean(),
    InternshipTaskSubmission.find({ internship: iid })
      .populate("student", "name email")
      .populate("task", "title points")
      .lean(),
    Project.find({ internship: iid }).lean(),
    ProjectSubmission.find({ internship: iid })
      .populate("student", "name email")
      .populate("project", "title totalMarks")
      .lean(),
    InternshipMilestone.find({ internship: iid }).sort({ sortOrder: 1 }).lean(),
    InternshipEvaluation.find({ internship: iid }).lean(),
    User.find({ role: "student", status: "active" })
      .select("name email")
      .sort({ name: 1 })
      .lean(),
  ]);
  return (
    <OfficeShell session={user!}>
      <Suspense fallback={<p className="text-sm text-slate-500">Loading internship…</p>}>
        <InternshipAdminDetail
          data={serialize({
            internship,
            applications,
            enrollments,
            tasks,
            taskSubs,
            projects,
            projectSubs,
            milestones,
            evaluations,
            students,
          })}
        />
      </Suspense>
    </OfficeShell>
  );
}
