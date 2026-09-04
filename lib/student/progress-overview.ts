import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db/connect";
import { Certificate } from "@/models/Certificate";
import { Progress } from "@/models/Progress";
import { getEnrolledCourses } from "./dashboard";

export async function getStudentProgressOverview(studentId: string) {
  await connectDB();
  const [courses, records, certificates] = await Promise.all([
    getEnrolledCourses(studentId),
    Progress.find({ student: new Types.ObjectId(studentId) }).select("status watchedSeconds completedAt lastViewedAt updatedAt").lean(),
    Certificate.countDocuments({ student: new Types.ObjectId(studentId), status: "issued" }),
  ]);
  const totalLessons = courses.reduce((sum, course) => sum + course.totalLessons, 0);
  const completedLessons = courses.reduce((sum, course) => sum + course.completedLessons, 0);
  const learningSeconds = records.reduce((sum, record) => sum + (record.watchedSeconds ?? 0), 0);
  const dayKeys = new Set(records.map((record) => (record.lastViewedAt ?? record.completedAt ?? record.updatedAt).toISOString().slice(0, 10)));
  let streak = 0; const cursor = new Date();
  if (!dayKeys.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (dayKeys.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor.setDate(cursor.getDate() - 1); }
  const activity = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (6 - offset));
    const next = new Date(date); next.setDate(next.getDate() + 1);
    return { label: date.toLocaleDateString("en-IN", { weekday: "short" }), count: records.filter((record) => { const at = record.completedAt ?? record.lastViewedAt ?? record.updatedAt; return at >= date && at < next; }).length };
  });
  return { courses, totalLessons, completedLessons, overallProgress: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0, activeCourses: courses.filter((course) => course.status !== "completed").length, completedCourses: courses.filter((course) => course.status === "completed").length, learningHours: Math.round((learningSeconds / 3600) * 10) / 10, streak, certificates, activity };
}
