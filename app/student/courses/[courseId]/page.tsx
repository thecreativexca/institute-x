import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { getValidatedStudent } from "@/lib/auth/helpers";
import { connectDB } from "@/lib/db/connect";
import { getCertificateByEnrollment } from "@/lib/certificates/queries";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Types } from "mongoose";
import { StudentCourseDetailClient } from "./StudentCourseDetailClient";

interface CourseData {
  _id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  level: string;
  durationWeeks?: number;
  price?: number;
  currency: string;
  thumbnailUrl?: string;
  category: { _id: string; name: string } | null;
}

interface EnrollmentData {
  _id: string;
  status: string;
  enrolledAt: string;
  completedAt?: string | null;
}

/** Curriculum data passed to the client (Phase 8 bridge to lesson pages). */
export interface CurriculumLesson {
  id: string;
  title: string;
  durationMinutes: number | null;
}

export interface CurriculumModule {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  void params;
  return {
    title: "Course Details",
    description: "View course details and continue learning.",
    robots: { index: false, follow: false },
  };
}

export default async function StudentCourseDetailPage({ params }: RouteParams) {
  const { user: student, error } = await getValidatedStudent();

  if (!student || error) {
    redirect("/login");
  }

  const resolvedParams = await params;

  await connectDB();

  // Verify student owns this course
  const enrollment = await Enrollment.findOne({
    student: new Types.ObjectId(student.id),
    course: new Types.ObjectId(resolvedParams.courseId),
    status: { $in: ["active", "completed"] },
  }).lean();

  if (!enrollment) {
    notFound();
  }

  const course = await Course.findById(resolvedParams.courseId)
    .populate("category", "name")
    .lean();

  if (!course) {
    notFound();
  }

  const category = course.category as unknown as { _id: Types.ObjectId; name: string } | Types.ObjectId | null;

  let categoryData: { _id: string; name: string } | null = null;
  if (category && typeof category === "object" && category !== null && "_id" in category) {
    const cat = category as { _id: Types.ObjectId; name: string };
    categoryData = { _id: cat._id.toString(), name: cat.name };
  }

  const courseData: CourseData = {
    _id: course._id.toString(),
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    description: course.description,
    level: course.level,
    durationWeeks: course.durationWeeks,
    price: course.price,
    currency: course.currency,
    thumbnailUrl: course.thumbnailUrl,
    category: categoryData,
  };

  const enrollmentData: EnrollmentData = {
    _id: enrollment._id.toString(),
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    completedAt: enrollment.completedAt?.toISOString() ?? null,
  };

  // Certificate state for this enrollment (§40): never fabricated — an issued
  // certificate must actually exist in the DB.
  const certificate = await getCertificateByEnrollment(enrollment._id.toString());

  // Curriculum bridge (Phase 8): published modules + lessons so the student
  // can reach each lesson page (and its Learning Resources).
  const [modules, lessons] = await Promise.all([
    Module.find({ course: course._id })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("title")
      .lean(),
    Lesson.find({ course: course._id })
      .sort({ sortOrder: 1, createdAt: 1 })
      .select("title module durationMinutes")
      .lean(),
  ]);

  const curriculum: CurriculumModule[] = modules.map((module) => ({
    id: module._id.toString(),
    title: module.title,
    lessons: lessons
      .filter(
        (lesson) => (lesson.module as Types.ObjectId).toString() === module._id.toString()
      )
      .map((lesson) => ({
        id: lesson._id.toString(),
        title: lesson.title,
        durationMinutes:
          typeof lesson.durationMinutes === "number" ? lesson.durationMinutes : null,
      })),
  }));

  return (
    <StudentCourseDetailClient
      course={courseData}
      enrollment={enrollmentData}
      studentId={student.id}
      modules={curriculum}
      certificate={certificate ?? null}
    />
  );
}
