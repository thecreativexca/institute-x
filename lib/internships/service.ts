import "server-only";
import { Types } from "mongoose";
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
import { Enrollment } from "@/models/Enrollment";
import { Progress } from "@/models/Progress";
import { Lesson } from "@/models/Lesson";
import { notifyAdmins, notifyUser } from "@/lib/notifications/service";

export function objectId(value: string) {
  if (!Types.ObjectId.isValid(value)) throw new Error("Invalid identifier");
  return new Types.ObjectId(value);
}

export function optionalObjectId(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  return objectId(value);
}

export function parseDateInput(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T23:59:59.999`);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function optionalNumber(value: unknown) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
}
export function gradeFor(percentage: number) {
  return percentage >= 90
    ? "A+"
    : percentage >= 80
      ? "A"
      : percentage >= 70
        ? "B"
        : percentage >= 60
          ? "C"
          : percentage >= 50
            ? "D"
            : "F";
}

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}
export async function checkInternshipEligibility(
  studentId: string,
  internshipOrId: string | Record<string, unknown>,
): Promise<EligibilityResult> {
  await connectDB();
  const internship =
    typeof internshipOrId === "string"
      ? await Internship.findById(objectId(internshipOrId)).lean()
      : internshipOrId;
  if (!internship) return { eligible: false, reason: "Internship not found." };
  const row = internship as any;
  if (row.status !== "open")
    return { eligible: false, reason: "Applications are not open." };
  const now = new Date();
  if (row.applicationStartDate && new Date(row.applicationStartDate) > now)
    return { eligible: false, reason: "Applications have not started." };
  if (row.applicationEndDate && new Date(row.applicationEndDate) < now)
    return { eligible: false, reason: "The application deadline has passed." };
  if (
    (row.manuallySelectedStudents ?? []).some(
      (id: Types.ObjectId) => id.toString() === studentId,
    )
  )
    return { eligible: true };
  if (row.openToAllActiveStudents) return { eligible: true };
  const courseIds = (row.eligibleCourses ?? []).map(
    (course: Types.ObjectId | { _id: Types.ObjectId }) =>
      course instanceof Types.ObjectId ? course : course._id,
  );
  if (!courseIds.length)
    return {
      eligible: false,
      reason: "This internship is limited to selected students.",
    };
  const enrollment = await Enrollment.findOne({
    student: objectId(studentId),
    course: { $in: courseIds },
    status: row.courseCompletionRequired
      ? "completed"
      : { $in: ["active", "completed"] },
  }).lean();
  if (!enrollment)
    return {
      eligible: false,
      reason: row.courseCompletionRequired
        ? "Complete an eligible course first."
        : "An active enrollment in an eligible course is required.",
    };
  if (row.minimumCourseProgress != null && enrollment.status !== "completed") {
    const [completed, total] = await Promise.all([
      Progress.countDocuments({
        student: objectId(studentId),
        course: enrollment.course,
        status: "completed",
      }),
      Lesson.countDocuments({ course: enrollment.course }),
    ]);
    const percent = total ? Math.round((completed / total) * 100) : 0;
    if (percent < row.minimumCourseProgress)
      return {
        eligible: false,
        reason: `At least ${row.minimumCourseProgress}% course progress is required (current: ${percent}%).`,
      };
  }
  return { eligible: true };
}

export async function listStudentInternships(studentId: string) {
  await connectDB();
  const [rows, applications, enrollments] = await Promise.all([
    Internship.find({ status: { $in: ["open", "running", "completed"] } })
      .populate("eligibleCourses", "name")
      .sort({ applicationEndDate: 1, createdAt: -1 })
      .lean(),
    InternshipApplication.find({ student: objectId(studentId) }).lean(),
    InternshipEnrollment.find({
      student: objectId(studentId),
      status: { $ne: "removed" },
    }).lean(),
  ]);
  const appMap = new Map(
    applications.map((x: any) => [x.internship.toString(), x]),
  );
  const enrollmentMap = new Map(
    enrollments.map((x: any) => [x.internship.toString(), x]),
  );
  return Promise.all(
    rows.map(async (row: any) => ({
      ...serialize(row),
      eligibility: await checkInternshipEligibility(studentId, row),
      application: serialize(appMap.get(row._id.toString())),
      enrollment: serialize(enrollmentMap.get(row._id.toString())),
    })),
  );
}

export async function calculateInternshipProgress(
  internshipId: string,
  studentId: string,
) {
  await connectDB();
  const iid = objectId(internshipId),
    sid = objectId(studentId);
  const [tasks, taskDone, projects, projectDone, milestones] =
    await Promise.all([
      InternshipTask.countDocuments({ internship: iid, status: "published" }),
      InternshipTaskSubmission.countDocuments({
        internship: iid,
        student: sid,
        status: "completed",
      }),
      Project.countDocuments({ internship: iid, status: "published" }),
      ProjectSubmission.countDocuments({
        internship: iid,
        student: sid,
        status: { $in: ["approved", "completed"] },
      }),
      InternshipMilestone.countDocuments({ internship: iid }),
    ]);
  const taskPercent = tasks ? (taskDone / tasks) * 100 : null;
  const projectPercent = projects ? (projectDone / projects) * 100 : null;
  const parts = [taskPercent, projectPercent].filter(
    (x): x is number => x !== null,
  );
  const overall = parts.length
    ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
    : 100;
  await InternshipEnrollment.updateOne(
    { internship: iid, student: sid },
    {
      $set: {
        progressPercentage: overall,
        completedTasks: taskDone,
        totalTasks: tasks,
        completedProjects: projectDone,
        totalProjects: projects,
      },
    },
  );
  return {
    overall,
    tasks: { completed: taskDone, total: tasks },
    projects: { completed: projectDone, total: projects },
    milestones: { total: milestones },
  };
}

export async function getStudentInternshipDetail(
  internshipId: string,
  studentId: string,
) {
  await connectDB();
  const iid = objectId(internshipId),
    sid = objectId(studentId);
  const internship = await Internship.findById(iid)
    .populate("eligibleCourses", "name")
    .lean();
  if (!internship) return null;
  const [application, enrollment, tasks, projects, milestones, evaluation] =
    await Promise.all([
      InternshipApplication.findOne({ internship: iid, student: sid }).lean(),
      InternshipEnrollment.findOne({
        internship: iid,
        student: sid,
        status: { $ne: "removed" },
      }).lean(),
      InternshipTask.find({ internship: iid, status: "published" })
        .sort({ sortOrder: 1 })
        .lean(),
      Project.find({ internship: iid, status: "published" })
        .sort({ dueDate: 1 })
        .lean(),
      InternshipMilestone.find({ internship: iid })
        .sort({ sortOrder: 1 })
        .lean(),
      InternshipEvaluation.findOne({ internship: iid, student: sid }).lean(),
    ]);
  const eligibility = await checkInternshipEligibility(
    studentId,
    internship as any,
  );
  const progress = enrollment
    ? await calculateInternshipProgress(internshipId, studentId)
    : null;
  const taskSubs = enrollment
    ? await InternshipTaskSubmission.find({
        internship: iid,
        student: sid,
      }).lean()
    : [];
  return {
    internship: serialize(internship),
    eligibility,
    application: serialize(application),
    enrollment: serialize(enrollment),
    tasks: enrollment ? tasks.map((x: any) => serialize(x)) : [],
    taskSubmissions: taskSubs.map((x: any) => serialize(x)),
    projects: enrollment ? projects.map((x: any) => serialize(x)) : [],
    milestones: enrollment ? milestones.map((x: any) => serialize(x)) : [],
    evaluation: enrollment ? serialize(evaluation) : null,
    progress,
  };
}

export async function applyForInternship(
  studentId: string,
  internshipId: string,
  input: Record<string, unknown>,
) {
  await connectDB();
  const eligibility = await checkInternshipEligibility(studentId, internshipId);
  if (!eligibility.eligible)
    throw new Error(eligibility.reason ?? "Not eligible");
  const internship = await Internship.findById(objectId(internshipId));
  if (!internship || !internship.applicationRequired)
    throw new Error("This internship does not accept applications.");
  const existingEnrollment = await InternshipEnrollment.exists({
    internship: internship._id,
    student: objectId(studentId),
    status: { $ne: "removed" },
  });
  if (existingEnrollment)
    throw new Error("You are already assigned to this internship.");
  const existing = await InternshipApplication.findOne({
    internship: internship._id,
    student: objectId(studentId),
  });
  if (existing && existing.status !== "withdrawn")
    throw new Error("An active application already exists.");
  const application =
    existing ??
    new InternshipApplication({
      internship: internship._id,
      student: objectId(studentId),
    });
  Object.assign(application, {
    message: input.message,
    portfolioUrl: input.portfolioUrl,
    githubUrl: input.githubUrl,
    status: internship.autoApproval ? "approved" : "pending",
    appliedAt: new Date(),
  });
  await application.save();
  if (internship.autoApproval) {
    await assertInternshipHasSeat(internship._id);
    await ensureInternshipEnrollment(
      internship._id,
      objectId(studentId),
      application._id,
    );
  }
  else
    await notifyAdmins({
      title: "New internship application",
      message: `A student applied for ${internship.title}.`,
      link: `/office/internships/${internship._id}?tab=applications`,
    });
  await notifyUser({
    recipientId: studentId,
    title: "Application submitted",
    message: `Your application for ${internship.title} was submitted.`,
    type: "success",
    link: `/student/internships/${internship._id}`,
  });
  return serialize(application.toObject());
}

export async function joinInternship(
  studentId: string,
  internshipId: string,
) {
  await connectDB();
  const internship = await Internship.findById(objectId(internshipId)).lean();
  if (!internship) throw new Error("Internship not found.");
  const row = internship as any;
  if (row.status !== "open")
    throw new Error("This internship is not accepting participants.");
  if (row.applicationRequired)
    throw new Error("This internship requires an application.");
  const eligibility = await checkInternshipEligibility(studentId, internshipId);
  if (!eligibility.eligible)
    throw new Error(eligibility.reason ?? "Not eligible");
  const sid = objectId(studentId);
  const existing = await InternshipEnrollment.findOne({
    internship: internship._id,
    student: sid,
  });
  if (existing && existing.status !== "removed")
    throw new Error("You are already enrolled in this internship.");
  await assertInternshipHasSeat(internship._id);
  await InternshipEnrollment.findOneAndUpdate(
    { internship: internship._id, student: sid },
    {
      $set: { status: "active", application: null, joinedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await notifyUser({
    recipientId: studentId,
    title: "Internship joined",
    message: `You have joined ${internship.title}.`,
    type: "success",
    link: `/student/internships/${internship._id}`,
  });
  await notifyAdmins({
    title: "Student joined internship",
    message: `A student self-enrolled in ${internship.title}.`,
    link: `/office/internships/${internship._id}?tab=students`,
  });
  return { ok: true };
}

export async function assertInternshipHasSeat(internshipId: Types.ObjectId) {
  const internship = await Internship.findById(internshipId).select("seats").lean();
  if (!internship) throw new Error("Internship not found.");
  if (!internship.seats) return;
  const taken = await InternshipEnrollment.countDocuments({
    internship: internshipId,
    status: { $ne: "removed" },
  });
  if (taken >= internship.seats) throw new Error("All seats are filled.");
}

export function completionBlockedReason(
  rules: {
    requireTasks?: boolean;
    requireProjects?: boolean;
    minimumProgress?: number | null;
    minimumScore?: number | null;
  },
  progress: {
    overall: number;
    tasks: { completed: number; total: number };
    projects: { completed: number; total: number };
  },
  finalScore?: number | null,
) {
  if (rules.requireTasks && progress.tasks.total > 0 && progress.tasks.completed < progress.tasks.total) {
    return "Required tasks are incomplete.";
  }
  if (
    rules.requireProjects &&
    progress.projects.total > 0 &&
    progress.projects.completed < progress.projects.total
  ) {
    return "Required projects are incomplete.";
  }
  if (rules.minimumProgress != null && progress.overall < rules.minimumProgress) {
    return `Minimum progress of ${rules.minimumProgress}% is required.`;
  }
  if (rules.minimumScore != null && (finalScore ?? 0) < rules.minimumScore) {
    return `Minimum score of ${rules.minimumScore} is required.`;
  }
  return null;
}

export async function ensureInternshipEnrollment(
  internshipId: Types.ObjectId,
  studentId: Types.ObjectId,
  applicationId?: Types.ObjectId,
) {
  const existing = await InternshipEnrollment.findOne({
    internship: internshipId,
    student: studentId,
  });
  if (existing && existing.status !== "removed") return existing;
  await assertInternshipHasSeat(internshipId);
  return InternshipEnrollment.findOneAndUpdate(
    { internship: internshipId, student: studentId },
    {
      $set: {
        status: "selected",
        application: applicationId ?? null,
        joinedAt: new Date(),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function requireInternshipParticipant(
  internshipId: string,
  studentId: string,
) {
  await connectDB();
  return InternshipEnrollment.findOne({
    internship: objectId(internshipId),
    student: objectId(studentId),
    status: { $in: ["selected", "active", "paused", "completed"] },
  });
}

export async function listStudentProjects(studentId: string) {
  await connectDB();
  const sid = objectId(studentId);
  const [courseEnrollments, internships] = await Promise.all([
    Enrollment.find({
      student: sid,
      status: { $in: ["active", "completed"] },
    }).distinct("course"),
    InternshipEnrollment.find({
      student: sid,
      status: { $in: ["selected", "active", "paused", "completed"] },
    }).distinct("internship"),
  ]);
  const rows = await Project.find({
    status: "published",
    $or: [
      { assignedStudents: sid },
      { course: { $in: courseEnrollments } },
      { internship: { $in: internships } },
    ],
  })
    .populate("course", "name")
    .populate("internship", "title")
    .sort({ dueDate: 1 })
    .lean();
  const submissions = await ProjectSubmission.find({
    student: sid,
    project: { $in: rows.map((x: any) => x._id) },
  }).lean();
  const map = new Map(submissions.map((x: any) => [x.project.toString(), x]));
  return rows.map((x: any) => ({
    ...serialize(x),
    submission: serialize(map.get(x._id.toString())),
  }));
}
export async function getStudentProjectDetail(
  projectId: string,
  studentId: string,
) {
  const rows = await listStudentProjects(studentId),
    project = rows.find((x: any) => x._id === projectId);
  return project ?? null;
}
export async function studentCanAccessProject(
  projectId: string,
  studentId: string,
) {
  return Boolean(await getStudentProjectDetail(projectId, studentId));
}
export function serialize(value: any): any {
  if (value == null) return null;
  return JSON.parse(JSON.stringify(value));
}
