import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { Enrollment } from "@/models/Enrollment";
import { Quiz, type IQuiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizError } from "./errors";
import { QUIZ_ACCESS_ERROR, type QuizAvailability } from "./types";

export function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/**
 * Availability of a quiz purely from its configured window.
 * Does not consider published state or enrollment.
 */
export function availabilityOf(
  quiz: Pick<IQuiz, "availableFrom" | "availableUntil">,
  now: Date = new Date()
): QuizAvailability {
  if (quiz.availableFrom && now.getTime() < quiz.availableFrom.getTime()) {
    return "upcoming";
  }
  if (quiz.availableUntil && now.getTime() > quiz.availableUntil.getTime()) {
    return "expired";
  }
  return "available";
}

export async function loadQuiz(quizId: string): Promise<IQuiz> {
  await connectDB();
  const quiz = await Quiz.findById(toObjectId(quizId)).lean();
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }
  return quiz as unknown as IQuiz;
}

/**
 * Validates server-side access to a quiz for a specific student:
 *   1. enrollment in the associated course
 *   2. published state (unless `requirePublished` is false)
 *   3. availability window (unless `allowUnavailable` is true)
 *
 * Throws QuizError on failure. `studentId` always comes from the session.
 */
export async function assertQuizAccessForStudent(
  studentId: string,
  quiz: IQuiz,
  opts: { requirePublished?: boolean; allowUnavailable?: boolean } = {}
): Promise<void> {
  await connectDB();

  const enrollment = await Enrollment.findOne({
    student: toObjectId(studentId),
    course: quiz.course,
    status: { $in: ["active", "completed"] },
  }).lean();

  if (!enrollment) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.NOT_ENROLLED,
      "You are not enrolled in this course."
    );
  }

  if (opts.requirePublished !== false && !quiz.isPublished) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.NOT_PUBLISHED,
      "This test is not available."
    );
  }

  if (opts.allowUnavailable !== true) {
    const availability = availabilityOf(quiz);
    if (availability === "upcoming") {
      throw new QuizError(
        QUIZ_ACCESS_ERROR.NOT_AVAILABLE_YET,
        "This test is not available yet."
      );
    }
    if (availability === "expired") {
      throw new QuizError(
        QUIZ_ACCESS_ERROR.NO_LONGER_AVAILABLE,
        "This test is no longer available."
      );
    }
  }
}

/** Returns the number of published questions, throwing NO_QUESTIONS when zero. */
export async function assertQuizHasQuestions(quizId: string): Promise<number> {
  const count = await Question.countDocuments({
    quiz: toObjectId(quizId),
    isPublished: true,
  });
  if (count === 0) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.NO_QUESTIONS,
      "This test is not available yet."
    );
  }
  return count;
}
