import "server-only";

import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Assignment } from "@/models/Assignment";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { Submission } from "@/models/Submission";

export interface StudentAssignmentItem {
  id: string;
  title: string;
  instructions: string;
  courseId: string;
  courseName: string;
  maxScore: number;
  dueAt: string | null;
  submission: null | {
    id: string;
    status: string;
    content: string;
    fileUrl: string | null;
    originalFileName: string | null;
    submittedAt: string;
    score: number | null;
    totalMarks: number | null;
    feedback: string | null;
  };
}

export async function getStudentAssignments(studentId: string): Promise<StudentAssignmentItem[]> {
  await connectDB();
  const student = new Types.ObjectId(studentId);
  const enrollments = await Enrollment.find({
    student,
    status: { $in: ["active", "completed"] },
    $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  }).select("course").lean();
  const courseIds = enrollments.map((item) => item.course);
  if (!courseIds.length) return [];
  const [assignments, courses, submissions] = await Promise.all([
    Assignment.find({ course: { $in: courseIds }, isPublished: true }).sort({ dueAt: 1, createdAt: -1 }).lean(),
    Course.find({ _id: { $in: courseIds }, status: "published" }).select("name").lean(),
    Submission.find({ student, course: { $in: courseIds } }).lean(),
  ]);
  const courseMap = new Map(courses.map((item) => [item._id.toString(), item.name]));
  const submissionMap = new Map(submissions.map((item) => [item.assignment.toString(), item]));
  return assignments.filter((assignment) => courseMap.has(assignment.course.toString())).map((assignment) => {
    const submission = submissionMap.get(assignment._id.toString());
    return {
      id: assignment._id.toString(), title: assignment.title, instructions: assignment.instructions,
      courseId: assignment.course.toString(), courseName: courseMap.get(assignment.course.toString()) ?? "Course",
      maxScore: assignment.maxScore, dueAt: assignment.dueAt?.toISOString() ?? null,
      submission: submission ? {
        id: submission._id.toString(), status: submission.status, content: submission.content ?? "",
        fileUrl: submission.fileUrl ?? null, originalFileName: submission.originalFileName ?? null,
        submittedAt: submission.submittedAt.toISOString(), score: submission.score ?? null,
        totalMarks: submission.totalMarks ?? null, feedback: submission.feedback ?? null,
      } : null,
    };
  });
}
