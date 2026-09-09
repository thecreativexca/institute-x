import { NextRequest, NextResponse } from "next/server";
import { requireStudentApi } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import { ProjectSubmission } from "@/models/ProjectSubmission";
import {
  objectId,
  serialize,
  studentCanAccessProject,
  calculateInternshipProgress,
} from "@/lib/internships/service";
import { notifyAdmins } from "@/lib/notifications/service";
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { user, errorResponse } = await requireStudentApi();
  if (!user) return errorResponse!;
  try {
    const projectId = (await params).projectId,
      body = await request.json();
    if (
      !body.text &&
      !body.githubUrl &&
      !body.liveUrl &&
      !body.otherUrl &&
      !body.files?.length
    )
      return NextResponse.json(
        { success: false, error: "Add at least one submission field." },
        { status: 400 },
      );
    if (!(await studentCanAccessProject(projectId, user.id)))
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    await connectDB();
    const project = await Project.findById(objectId(projectId));
    if (!project)
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 },
      );
    if (
      project.dueDate &&
      project.dueDate < new Date() &&
      !project.allowLateSubmission
    )
      return NextResponse.json(
        { success: false, error: "The project deadline has passed." },
        { status: 400 },
      );
    const prior = await ProjectSubmission.findOne({
      project: project._id,
      student: objectId(user.id),
    });
    const history = prior
      ? [
          ...(prior.history ?? []),
          {
            text: prior.text,
            githubUrl: prior.githubUrl,
            liveUrl: prior.liveUrl,
            otherUrl: prior.otherUrl,
            files: prior.files,
            submittedAt: prior.submittedAt,
          },
        ]
      : [];
    const row = await ProjectSubmission.findOneAndUpdate(
      { project: project._id, student: objectId(user.id) },
      {
        $set: {
          ...body,
          internship: project.internship ?? null,
          status: "submitted",
          submittedAt: new Date(),
          history,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    await notifyAdmins({
      title: "Project submitted",
      message: `${project.title} has a new submission.`,
      link: project.internship
        ? `/office/internships/${project.internship}?tab=projects`
        : `/office/projects?project=${project._id}`,
    });
    if (project.internship)
      await calculateInternshipProgress(project.internship.toString(), user.id);
    return NextResponse.json({
      success: true,
      data: serialize(row.toObject()),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Unable to submit project.",
      },
      { status: 400 },
    );
  }
}
