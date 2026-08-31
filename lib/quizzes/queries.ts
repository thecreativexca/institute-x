import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import { QUIZ_ATTEMPT_STATUSES } from "@/lib/constants";
import { Enrollment } from "@/models/Enrollment";
import { Quiz, type IQuiz } from "@/models/Quiz";
import { Question, type IQuestion } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { availabilityOf, assertQuizAccessForStudent, toObjectId } from "./access";
import { submitQuizAttempt } from "./attempts";
import type { RawAttempt } from "./attempts";
import { QuizError } from "./errors";
import {
  QUIZ_ACCESS_ERROR,
  type AttemptHistoryRow,
  type AttemptQuestionView,
  type AttemptViewData,
  type QuizAvailability,
  type QuizDetailViewData,
  type QuizResultViewData,
  type QuizSummaryListItem,
  type ReviewQuestionView,
} from "./types";

interface RawCourse {
  _id: Types.ObjectId;
  name: string;
}
interface RawTitleRef {
  _id: Types.ObjectId;
  title: string;
}
interface RawQuizPopulated {
  _id: Types.ObjectId;
  course: Types.ObjectId | RawCourse;
  module?: Types.ObjectId | RawTitleRef | null;
  lesson?: Types.ObjectId | RawTitleRef | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  type: string;
  durationMinutes?: number | null;
  passingPercentage: number;
  totalMarks: number;
  maxAttempts?: number | null;
  availableFrom?: Date | null;
  availableUntil?: Date | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  isPublished: boolean;
  createdAt: Date;
}

function courseRef(v: Types.ObjectId | RawCourse): RawCourse {
  if (v && typeof v === "object" && "_id" in v) {
    return v as RawCourse;
  }
  return { _id: v as Types.ObjectId, name: "Course" };
}

function titleRef(
  v: Types.ObjectId | RawTitleRef | null | undefined
): RawTitleRef | null {
  if (!v) return null;
  if (v && typeof v === "object" && "_id" in v) {
    return v as RawTitleRef;
  }
  return { _id: v as Types.ObjectId, title: "" };
}

function describeBlockReason(input: {
  availability: QuizAvailability;
  canTakeMore: boolean;
  hasQuestions: boolean;
}): string | null {
  if (!input.hasQuestions) return "This test is not available yet.";
  if (input.availability === "upcoming") return "This test is not available yet.";
  if (input.availability === "expired") return "This test is no longer available.";
  if (!input.canTakeMore) return "You have used all available attempts.";
  return null;
}

function buildHistory(attempts: RawAttempt[]): AttemptHistoryRow[] {
  return attempts
    .filter(
      (a) =>
        a.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
        a.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
    )
    .map((a) => ({
      attemptId: a._id.toString(),
      attemptNumber: a.attemptNumber,
      submittedAt: a.submittedAt?.toISOString() ?? null,
      score: a.score,
      totalMarks: a.totalMarks,
      percentage: a.percentage,
      status: a.status as AttemptHistoryRow["status"],
      passed: a.passed,
    }));
}

/** All published, enrolled-course quizzes visible to the student. */
export async function getStudentQuizSummaries(
  studentId: string
): Promise<QuizSummaryListItem[]> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);

  const enrollments = (await Enrollment.find({
    student: studentObjectId,
    status: { $in: ["active", "completed"] },
  })
    .populate({
      path: "course",
      select: "name",
      match: { status: "published" },
    })
    .lean()) as unknown as Array<{ course: Types.ObjectId | RawCourse | null }>;

  const courseIds = enrollments
    .filter(
      (e): e is { course: RawCourse } =>
        !!e.course && typeof e.course === "object" && "_id" in e.course
    )
    .map((e) => e.course._id);

  if (courseIds.length === 0) return [];

  const quizzes = (await Quiz.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .populate([
      { path: "course", select: "name" },
      { path: "module", select: "title" },
      { path: "lesson", select: "title" },
    ])
    .sort({ createdAt: 1 })
    .lean()) as unknown as RawQuizPopulated[];

  if (quizzes.length === 0) return [];

  const quizIds = quizzes.map((q) => q._id);

  const questionCountRows = await Question.aggregate<{
    _id: Types.ObjectId;
    count: number;
  }>([
    { $match: { quiz: { $in: quizIds }, isPublished: true } },
    { $group: { _id: "$quiz", count: { $sum: 1 } } },
  ]);
  const questionCounts = new Map(
    questionCountRows.map((r) => [r._id.toString(), r.count])
  );

  const attempts = (await QuizAttempt.find({
    student: studentObjectId,
    quiz: { $in: quizIds },
  }).lean()) as unknown as RawAttempt[];

  const attemptsByQuiz = new Map<string, RawAttempt[]>();
  for (const a of attempts) {
    const key = a.quiz.toString();
    const arr = attemptsByQuiz.get(key) ?? [];
    arr.push(a);
    attemptsByQuiz.set(key, arr);
  }

  const now = new Date();
  return quizzes.map((q) => {
    const quizId = q._id.toString();
    const quizAttempts = attemptsByQuiz.get(quizId) ?? [];
    const submitted = quizAttempts.filter(
      (a) =>
        a.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
        a.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
    );
    const inProgress =
      quizAttempts.find((a) => a.status === QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) ??
      null;
    const latest = submitted.length
      ? [...submitted].sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        )[0]
      : null;
    const bestPercentage = submitted.length
      ? Math.max(...submitted.map((a) => a.percentage))
      : null;
    const bestScore = submitted.length
      ? Math.max(...submitted.map((a) => a.score))
      : null;
    const attemptsUsed = submitted.length;
    const maxAttempts = q.maxAttempts ?? null;
    const canTakeMore = maxAttempts === null || attemptsUsed < maxAttempts;
    const hasQuestions = (questionCounts.get(quizId) ?? 0) > 0;
    const availability = availabilityOf(q as IQuiz, now);
    const blockReason = describeBlockReason({
      availability,
      canTakeMore,
      hasQuestions,
    });
    const canAttempt =
      availability === "available" && hasQuestions && (canTakeMore || !!inProgress);

    const course = courseRef(q.course);
    const moduleDoc = titleRef(q.module);
    const lesson = titleRef(q.lesson);

    return {
      id: quizId,
      title: q.title,
      description: q.description ?? null,
      type: q.type as QuizSummaryListItem["type"],
      courseId: course._id.toString(),
      courseTitle: course.name,
      moduleId: moduleDoc?._id.toString() ?? null,
      moduleTitle: (moduleDoc?.title || null) as string | null,
      lessonId: lesson?._id.toString() ?? null,
      lessonTitle: (lesson?.title || null) as string | null,
      questionCount: questionCounts.get(quizId) ?? 0,
      totalMarks: q.totalMarks,
      passingPercentage: q.passingPercentage,
      durationMinutes: q.durationMinutes ?? null,
      maxAttempts,
      attemptsUsed,
      bestPercentage,
      bestScore,
      latestSubmittedAttemptId: latest?._id.toString() ?? null,
      inProgressAttemptId: inProgress?._id.toString() ?? null,
      availability,
      canAttempt,
      blockReason,
      availableFrom: q.availableFrom?.toISOString() ?? null,
      availableUntil: q.availableUntil?.toISOString() ?? null,
    };
  });
}

/**
 * Loads a single quiz (verified accessible to the student) with its attempt
 * statistics + history, for the instructions page.
 */
export async function getStudentQuizDetail(
  studentId: string,
  quizId: string
): Promise<QuizDetailViewData> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);

  const quiz = (await Quiz.findById(toObjectId(quizId))
    .populate([
      { path: "course", select: "name" },
      { path: "module", select: "title" },
      { path: "lesson", select: "title" },
    ])
    .lean()) as unknown as RawQuizPopulated | null;

  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }
  await assertQuizAccessForStudent(studentId, quiz as unknown as IQuiz);

  const questionCount = await Question.countDocuments({
    quiz: quiz._id,
    isPublished: true,
  });

  const attempts = (await QuizAttempt.find({
    student: studentObjectId,
    quiz: quiz._id,
  }).lean()) as unknown as RawAttempt[];
  const submitted = attempts.filter(
    (a) =>
      a.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
      a.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
  );
  const inProgress =
    attempts.find((a) => a.status === QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) ?? null;

  const attemptsUsed = submitted.length;
  const maxAttempts = quiz.maxAttempts ?? null;
  const canTakeMore = maxAttempts === null || attemptsUsed < maxAttempts;
  const hasQuestions = questionCount > 0;
  const availability = availabilityOf(quiz as unknown as IQuiz);
  const blockReason = describeBlockReason({
    availability,
    canTakeMore,
    hasQuestions,
  });

  let inProgressAttemptId: string | null = null;
  let inProgressRemainingSeconds: number | null = null;
  if (inProgress) {
    const q = quiz as unknown as IQuiz;
    if (q.durationMinutes == null) {
      inProgressAttemptId = inProgress._id.toString();
    } else {
      const deadline =
        inProgress.startedAt.getTime() + q.durationMinutes * 60 * 1000;
      const remaining = Math.floor((deadline - Date.now()) / 1000);
      if (remaining > 0) {
        inProgressAttemptId = inProgress._id.toString();
        inProgressRemainingSeconds = remaining;
      }
    }
  }

  const bestPercentage = submitted.length
    ? Math.max(...submitted.map((a) => a.percentage))
    : null;
  const bestScore = submitted.length
    ? Math.max(...submitted.map((a) => a.score))
    : null;

  const course = courseRef(quiz.course);
  const moduleDoc = titleRef(quiz.module);
  const lesson = titleRef(quiz.lesson);

  return {
    id: quiz._id.toString(),
    title: quiz.title,
    description: quiz.description ?? null,
    instructions: quiz.instructions ?? null,
    type: quiz.type as QuizDetailViewData["type"],
    courseId: course._id.toString(),
    courseTitle: course.name,
    moduleId: moduleDoc?._id.toString() ?? null,
    moduleTitle: moduleDoc?.title || null,
    lessonId: lesson?._id.toString() ?? null,
    lessonTitle: lesson?.title || null,
    questionCount,
    totalMarks: quiz.totalMarks,
    passingPercentage: quiz.passingPercentage,
    durationMinutes: quiz.durationMinutes ?? null,
    maxAttempts,
    attemptsUsed,
    bestPercentage,
    bestScore,
    inProgressAttemptId,
    inProgressRemainingSeconds,
    availability,
    canAttempt:
      availability === "available" && hasQuestions && (canTakeMore || !!inProgress),
    blockReason,
    availableFrom: quiz.availableFrom?.toISOString() ?? null,
    availableUntil: quiz.availableUntil?.toISOString() ?? null,
    history: buildHistory(attempts),
  };
}

/**
 * Loads the MCQ interface data for an active attempt owned by this student.
 * Correct answers are NEVER included here.
 */
export async function getStudentAttemptView(
  studentId: string,
  quizId: string,
  attemptId: string
): Promise<AttemptViewData> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);

  const attempt = (await QuizAttempt.findOne({
    _id: toObjectId(attemptId),
    student: studentObjectId,
  }).lean()) as unknown as RawAttempt | null;

  if (!attempt || attempt.quiz.toString() !== quizId) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND,
      "Attempt not found."
    );
  }

  const quiz = (await Quiz.findById(attempt.quiz)
    .populate({ path: "course", select: "name" })
    .lean()) as unknown as (RawQuizPopulated & { type: string }) | null;
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }

  // If the attempt is finalized (e.g. time ran out), the student should see
  // the result instead of the questions.
  if (
    attempt.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
    attempt.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
  ) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_INVALID,
      "This attempt has already been submitted."
    );
  }

  // Load the questions in the attempt's stored (possibly shuffled) order.
  const questionIds = attempt.questionOrder.map((q) => q.toString());
  const questions = (await Question.find({
    _id: { $in: questionIds.map(toObjectId) },
    quiz: attempt.quiz,
    isPublished: true,
  }).lean()) as unknown as IQuestion[];

  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  const ordered = questionIds
    .map((id) => questionsById.get(id))
    .filter((q): q is IQuestion => !!q);

  // Apply per-question option order.
  const optionOrderMap = new Map(
    attempt.optionOrders.map((o) => [o.questionId.toString(), o.optionOrder])
  );

  const deadline = quiz.durationMinutes
    ? attempt.startedAt.getTime() + quiz.durationMinutes * 60 * 1000
    : null;
  const serverNow = Date.now();

  // If timed and the time has passed, finalize as expired.
  if (deadline !== null && serverNow >= deadline) {
    await submitQuizAttempt({
      studentId,
      quizId,
      attemptId,
      reason: "expired",
    });
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_EXPIRED,
      "Test time has expired."
    );
  }

  const answersRecord: Record<string, string> = {};
  for (const a of attempt.answers) {
    answersRecord[a.questionId.toString()] = a.selectedOptionId;
  }

  const viewQuestions: AttemptQuestionView[] = ordered.map((q, index) => {
    const optionOrder = optionOrderMap.get(q._id.toString()) ??
      q.options.map((o) => o.id);
    const optionById = new Map(q.options.map((o) => [o.id, o]));
    const options = optionOrder
      .map((id) => optionById.get(id))
      .filter((o): o is { id: string; text: string } => !!o);

    return {
      id: q._id.toString(),
      question: q.question,
      options,
      marks: q.marks,
      order: index + 1,
    };
  });

  const course = courseRef(quiz.course);
  return {
    attemptId: attempt._id.toString(),
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    courseId: course._id.toString(),
    courseTitle: course.name,
    type: quiz.type as AttemptViewData["type"],
    status: attempt.status as AttemptViewData["status"],
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    attemptNumber: attempt.attemptNumber,
    durationMinutes: quiz.durationMinutes ?? null,
    deadlineAt: deadline,
    serverNow,
    totalMarks: quiz.totalMarks,
    passingPercentage: quiz.passingPercentage,
    questions: viewQuestions,
    answers: answersRecord,
    answeredCount: Object.keys(answersRecord).length,
    totalQuestions: viewQuestions.length,
  };
}

/**
 * Loads the result data for a finalized attempt owned by this student.
 * Correct answers / explanations are only included when the quiz config
 * (showCorrectAnswers) allows it — enforced server-side.
 */
export async function getStudentQuizResult(
  studentId: string,
  quizId: string,
  attemptId: string
): Promise<QuizResultViewData> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);

  const attempt = (await QuizAttempt.findOne({
    _id: toObjectId(attemptId),
    student: studentObjectId,
  }).lean()) as unknown as RawAttempt | null;

  if (!attempt || attempt.quiz.toString() !== quizId) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND,
      "Attempt not found."
    );
  }

  const quiz = (await Quiz.findById(attempt.quiz)
    .populate({ path: "course", select: "name" })
    .lean()) as unknown as (RawQuizPopulated & { type: string }) | null;
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }

  const isFinalized =
    attempt.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
    attempt.status === QUIZ_ATTEMPT_STATUSES.EXPIRED;

  // Best-effort finalize if the attempt is still in progress and timed out.
  if (
    !isFinalized &&
    quiz.durationMinutes &&
    Date.now() >=
      attempt.startedAt.getTime() + quiz.durationMinutes * 60 * 1000
  ) {
    await submitQuizAttempt({
      studentId,
      quizId,
      attemptId,
      reason: "expired",
    });
  }

  const reloaded = (await QuizAttempt.findById(attempt._id).lean()) as unknown as
    | RawAttempt
    | null;
  const final = reloaded ?? attempt;
  const finalStatus: QuizResultViewData["status"] =
    final.status === QUIZ_ATTEMPT_STATUSES.EXPIRED ? "expired" : "submitted";

  // If the attempt is still in progress (no time limit), there is no result yet.
  if (final.status === QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_INVALID,
      "This attempt is still in progress."
    );
  }

  const allAttempts = (await QuizAttempt.find({
    student: studentObjectId,
    quiz: quiz._id,
  }).lean()) as unknown as RawAttempt[];

  const questionIds = final.questionOrder.map((q) => q.toString());
  const questions = questionIds.length
    ? ((await Question.find({
        _id: { $in: questionIds.map(toObjectId) },
        quiz: quiz._id,
        isPublished: true,
      }).lean()) as unknown as IQuestion[])
    : [];

  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerMap = new Map(
    final.answers.map((a) => [a.questionId.toString(), a.selectedOptionId])
  );
  const optionOrderMap = new Map(
    final.optionOrders.map((o) => [o.questionId.toString(), o.optionOrder])
  );
  const showCorrect = quiz.showCorrectAnswers;

  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  const reviewQuestions: ReviewQuestionView[] | null = showCorrect
    ? questionIds
        .map((id) => questionsById.get(id))
        .filter((q): q is IQuestion => !!q)
        .map((q) => {
          const selected = answerMap.get(q._id.toString()) ?? null;
          const isCorrect =
            selected === null
              ? null
              : selected === q.correctOptionId;
          if (selected === null) unansweredCount += 1;
          else if (isCorrect) correctCount += 1;
          else incorrectCount += 1;

          const optionOrder = optionOrderMap.get(q._id.toString()) ??
            q.options.map((o) => o.id);
          const optionById = new Map(q.options.map((o) => [o.id, o]));
          const options = optionOrder
            .map((id) => optionById.get(id))
            .filter((o): o is { id: string; text: string } => !!o);

          return {
            id: q._id.toString(),
            question: q.question,
            options,
            marks: q.marks,
            selectedOptionId: selected,
            correctOptionId: showCorrect ? q.correctOptionId : null,
            isCorrect,
            explanation: q.explanation ?? null,
          };
        })
    : null;

  if (reviewQuestions === null) {
    // Counts are still useful without revealing answers.
    for (const id of questionIds) {
      const q = questionsById.get(id);
      if (!q) continue;
      const selected = answerMap.get(id) ?? null;
      if (selected === null) unansweredCount += 1;
      else if (selected === q.correctOptionId) correctCount += 1;
      else incorrectCount += 1;
    }
  }

  const course = courseRef(quiz.course);
  const submittedAll = allAttempts.filter(
    (a) =>
      a.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
      a.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
  );
  const inProgress =
    allAttempts.find((a) => a.status === QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) ??
    null;

  return {
    attemptId: final._id.toString(),
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    quizDescription: quiz.description ?? null,
    type: quiz.type as QuizResultViewData["type"],
    courseId: course._id.toString(),
    courseTitle: course.name,
    status: finalStatus,
    attemptNumber: final.attemptNumber,
    startedAt: final.startedAt.toISOString(),
    submittedAt: final.submittedAt?.toISOString() ?? new Date().toISOString(),
    score: final.score,
    totalMarks: final.totalMarks,
    percentage: final.percentage,
    passed: final.passed,
    passingPercentage: quiz.passingPercentage,
    correctCount,
    incorrectCount,
    unansweredCount,
    timeTakenSeconds: final.timeTakenSeconds,
    showCorrectAnswers: showCorrect,
    questions: reviewQuestions,
    maxAttempts: quiz.maxAttempts ?? null,
    attemptsUsed: submittedAll.length,
    inProgressAttemptId: inProgress?._id.toString() ?? null,
    history: buildHistory(allAttempts),
  };
}

