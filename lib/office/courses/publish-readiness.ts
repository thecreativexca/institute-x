import { connectDB } from "@/lib/db/connect";
import { toObjectId } from "@/lib/utils/object-id";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import type { PublishReadiness } from "./dto";

/**
 * Centralized publish readiness (req. 68–69). Blockers prevent publishing;
 * warnings are optional polish. No invented percentages.
 */
export async function getCoursePublishReadiness(
  courseId: string
): Promise<PublishReadiness> {
  await connectDB();

  const blockingIssues: string[] = [];
  const warnings: string[] = [];

  const course = await Course.findById(toObjectId(courseId))
    .select("name slug description shortDescription category price isFree thumbnailUrl faqs")
    .lean();

  if (!course) {
    return {
      ready: false,
      blockingIssues: ["Course not found."],
      warnings: [],
      setup: {
        basicInfo: false,
        thumbnail: false,
        curriculum: false,
        publishedLesson: false,
        pricing: false,
      },
    };
  }

  const basicInfo = !!(
    course.name &&
    course.description &&
    course.category
  );
  if (!basicInfo) {
    blockingIssues.push("Add a name, description and category.");
  }

  const [moduleCount, publishedLessonCount] = await Promise.all([
    Module.countDocuments({ course: course._id }),
    Lesson.countDocuments({ course: course._id, isPublished: true }),
  ]);

  const curriculum = moduleCount > 0;
  if (!curriculum) {
    blockingIssues.push("The course needs at least one module.");
  }
  const publishedLesson = publishedLessonCount > 0;
  if (!publishedLesson) {
    blockingIssues.push("Publish at least one lesson before publishing the course.");
  }

  const pricing =
    course.isFree || (typeof course.price === "number" && course.price > 0);
  if (!pricing) {
    blockingIssues.push(
      "Configure pricing: mark the course as free or set a price above zero."
    );
  }

  const thumbnail = !!course.thumbnailUrl;
  if (!thumbnail) warnings.push("No thumbnail image uploaded yet.");

  const faqs = Array.isArray(course.faqs) ? course.faqs.length : 0;
  if (faqs === 0) warnings.push("No FAQs added yet (optional).");

  return {
    ready: blockingIssues.length === 0,
    blockingIssues,
    warnings,
    setup: { basicInfo, thumbnail, curriculum, publishedLesson, pricing },
  };
}
