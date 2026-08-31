import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Enrollment } from "@/models/Enrollment";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { FacultyCourseAssignment } from "@/models/FacultyCourseAssignment";
import { Types } from "mongoose";
import {
  OfficeQuizSummary,
  OfficeQuizDetail,
  OfficeQuestionSummary,
  OfficeQuestionDetail,
  OfficeQuizResultSummary,
  OfficeQuizResultDetail,
  ReviewQuestion,
  QuestionOption,
  QuizFilters,
  QuizSortOptions,
  PaginationParams,
  QuizListResult,
} from "./dto";
import { QUIZ_ATTEMPT_STATUSES, type QuizAttemptStatus } from "@/lib/constants";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getUserCourseScope(userId: string, role: string): Promise<Types.ObjectId[] | null> {
  if (role === "super_admin" || role === "content_manager" || role === "office_staff") {
    return null;
  }
  if (role === "faculty") {
    const assignments = await FacultyCourseAssignment.find({ faculty: toObjectId(userId) })
      .select("course")
      .lean();
    return assignments.map((a) => a.course);
  }
  return [];
}

export async function getOfficeQuizzes(
  filters: QuizFilters,
  sort: QuizSortOptions,
  pagination: PaginationParams,
  userId: string,
  role: string
): Promise<QuizListResult> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const courseScope = await getUserCourseScope(userId, role);

  const query: Record<string, unknown> = {};

  if (courseScope) {
    if (courseScope.length === 0) {
      return {
        quizzes: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
    query.course = { $in: courseScope };
  }

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    query.title = regex;
  }

  if (filters.courseId && Types.ObjectId.isValid(filters.courseId)) {
    query.course = toObjectId(filters.courseId);
  }

  if (filters.moduleId && Types.ObjectId.isValid(filters.moduleId)) {
    query.module = toObjectId(filters.moduleId);
  }

  if (filters.type && filters.type !== "all") {
    query.type = filters.type;
  }

  if (filters.status === "published") {
    query.isPublished = true;
  } else if (filters.status === "draft") {
    query.isPublished = false;
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [quizzes, total] = await Promise.all([
    Quiz.find(query)
      .populate([
        { path: "course", select: "name" },
        { path: "module", select: "title" },
        { path: "lesson", select: "title" },
      ])
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Quiz.countDocuments(query),
  ]);

  if (quizzes.length === 0) {
    return {
      quizzes: [],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const quizIds = quizzes.map((q) => q._id);

  const [questionCounts, attemptCounts] = await Promise.all([
    Question.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { quiz: { $in: quizIds } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]),
    QuizAttempt.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { quiz: { $in: quizIds }, status: { $in: [QUIZ_ATTEMPT_STATUSES.SUBMITTED, QUIZ_ATTEMPT_STATUSES.EXPIRED] } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]),
  ]);

  const questionCountMap = new Map(questionCounts.map((q) => [q._id.toString(), q.count]));
  const attemptCountMap = new Map(attemptCounts.map((a) => [a._id.toString(), a.count]));

  const quizSummaries: OfficeQuizSummary[] = quizzes.map((quiz) => {
    const course = quiz.course as unknown as { _id: Types.ObjectId; name: string };
    const moduleDoc = quiz.module as unknown as { _id: Types.ObjectId; title: string } | null;
    const lesson = quiz.lesson as unknown as { _id: Types.ObjectId; title: string } | null;

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      courseId: course._id.toString(),
      courseName: course.name,
      moduleId: moduleDoc?._id.toString() ?? null,
      moduleTitle: moduleDoc?.title ?? null,
      lessonId: lesson?._id.toString() ?? null,
      lessonTitle: lesson?.title ?? null,
      type: quiz.type as OfficeQuizSummary["type"],
      questionCount: questionCountMap.get(quiz._id.toString()) ?? 0,
      totalMarks: quiz.totalMarks,
      passingPercentage: quiz.passingPercentage,
      durationMinutes: quiz.durationMinutes ?? null,
      maxAttempts: quiz.maxAttempts ?? null,
      isPublished: quiz.isPublished,
      attemptCount: attemptCountMap.get(quiz._id.toString()) ?? 0,
      updatedAt: quiz.updatedAt.toISOString(),
    };
  });

  return {
    quizzes: quizSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeQuizById(
  quizId: string,
  userId: string,
  role: string
): Promise<OfficeQuizDetail | null> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const query: Record<string, unknown> = { _id: toObjectId(quizId) };
  if (courseScope) {
    if (courseScope.length === 0) return null;
    query.course = { $in: courseScope };
  }

  const quiz = await Quiz.findOne(query)
    .populate([
      { path: "course", select: "name" },
      { path: "module", select: "title" },
      { path: "lesson", select: "title" },
    ])
    .lean();

  if (!quiz) return null;

  const questionCount = await Question.countDocuments({ quiz: quiz._id });
  const attemptCount = await QuizAttempt.countDocuments({
    quiz: quiz._id,
    status: { $in: [QUIZ_ATTEMPT_STATUSES.SUBMITTED, QUIZ_ATTEMPT_STATUSES.EXPIRED] },
  });

  const course = quiz.course as unknown as { _id: Types.ObjectId; name: string };
  const moduleDoc = quiz.module as unknown as { _id: Types.ObjectId; title: string } | null;
  const lesson = quiz.lesson as unknown as { _id: Types.ObjectId; title: string } | null;

  return {
    id: quiz._id.toString(),
    title: quiz.title,
    courseId: course._id.toString(),
    courseName: course.name,
    moduleId: moduleDoc?._id.toString() ?? null,
    moduleTitle: moduleDoc?.title ?? null,
    lessonId: lesson?._id.toString() ?? null,
    lessonTitle: lesson?.title ?? null,
    type: quiz.type as OfficeQuizSummary["type"],
    questionCount,
    totalMarks: quiz.totalMarks,
    passingPercentage: quiz.passingPercentage,
    durationMinutes: quiz.durationMinutes ?? null,
    maxAttempts: quiz.maxAttempts ?? null,
    isPublished: quiz.isPublished,
    attemptCount,
    updatedAt: quiz.updatedAt.toISOString(),
    description: quiz.description ?? null,
    instructions: quiz.instructions ?? null,
    availableFrom: quiz.availableFrom?.toISOString() ?? null,
    availableUntil: quiz.availableUntil?.toISOString() ?? null,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showCorrectAnswers: quiz.showCorrectAnswers,
    createdAt: quiz.createdAt.toISOString(),
    createdById: "",
    createdByName: "",
  };
}

export async function getOfficeQuizQuestions(
  quizId: string,
  userId: string,
  role: string
): Promise<OfficeQuestionSummary[]> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const quiz = await Quiz.findById(toObjectId(quizId)).lean();
  if (!quiz) return [];

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(quiz.course));
    if (!hasAccess) return [];
  }

  const questions = await Question.find({ quiz: quiz._id })
    .sort({ order: 1 })
    .lean();

  return questions.map((question) => ({
    id: question._id.toString(),
    quizId: question.quiz.toString(),
    question: question.question,
    optionCount: question.options.length,
    correctOptionId: question.correctOptionId,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    order: question.order,
    isPublished: question.isPublished,
  }));
}

export async function getOfficeQuizQuestionDetail(
  quizId: string,
  questionId: string,
  userId: string,
  role: string
): Promise<OfficeQuestionDetail | null> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const question = await Question.findOne({ _id: toObjectId(questionId), quiz: toObjectId(quizId) }).lean();
  if (!question) return null;

  const quiz = await Quiz.findById(question.quiz).lean();
  if (!quiz) return null;

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(quiz.course));
    if (!hasAccess) return null;
  }

  return {
    id: question._id.toString(),
    quizId: question.quiz.toString(),
    question: question.question,
    optionCount: question.options.length,
    correctOptionId: question.correctOptionId,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    order: question.order,
    isPublished: question.isPublished,
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
    explanation: question.explanation ?? null,
  };
}

export async function getOfficeQuizResults(
  quizId: string,
  filters: { search?: string; status?: string },
  sort: { field: string; direction: "asc" | "desc" },
  pagination: PaginationParams,
  userId: string,
  role: string
): Promise<{ results: OfficeQuizResultSummary[]; total: number; page: number; limit: number; totalPages: number }> {
  await connectDB();

  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const courseScope = await getUserCourseScope(userId, role);

  const quiz = await Quiz.findById(toObjectId(quizId)).lean();
  if (!quiz) {
    return { results: [], total: 0, page, limit, totalPages: 0 };
  }

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(quiz.course));
    if (!hasAccess) {
      return { results: [], total: 0, page, limit, totalPages: 0 };
    }
  }

  const query: Record<string, unknown> = { quiz: quiz._id };

  if (filters.search) {
    const escaped = escapeRegex(filters.search.trim());
    const regex = new RegExp(escaped, "i");
    const students = await User.find({ role: "student", $or: [{ name: regex }, { email: regex }] })
      .select("_id")
      .lean();
    const studentIds = students.map((s) => s._id);
    query.student = { $in: studentIds };
  }

  if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  const sortField = sort.field;
  const sortDirection = sort.direction === "asc" ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [sortField]: sortDirection };

  const [attempts, total] = await Promise.all([
    QuizAttempt.find(query)
      .populate({ path: "student", select: "name email" })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    QuizAttempt.countDocuments(query),
  ]);

  const resultSummaries: OfficeQuizResultSummary[] = attempts.map((attempt) => {
    const student = attempt.student as unknown as { _id: Types.ObjectId; name: string; email: string };
    return {
      id: attempt._id.toString(),
      studentId: student._id.toString(),
      studentName: student.name,
      studentEmail: student.email,
      attemptNumber: attempt.attemptNumber,
      startedAt: attempt.startedAt.toISOString(),
      submittedAt: attempt.submittedAt?.toISOString() ?? null,
      status: attempt.status as QuizAttemptStatus,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeTakenSeconds: attempt.timeTakenSeconds ?? null,
    };
  });

  return {
    results: resultSummaries,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfficeQuizResultDetail(
  quizId: string,
  attemptId: string,
  userId: string,
  role: string
): Promise<OfficeQuizResultDetail | null> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const attempt = await QuizAttempt.findOne({ _id: toObjectId(attemptId), quiz: toObjectId(quizId) })
    .populate({ path: "student", select: "name email" })
    .lean();

  if (!attempt) return null;

  const quiz = await Quiz.findById(attempt.quiz).lean();
  if (!quiz) return null;

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(quiz.course));
    if (!hasAccess) return null;
  }

  const course = await Course.findById(quiz.course).select("name").lean();
  const student = attempt.student as unknown as { _id: Types.ObjectId; name: string; email: string };

  const questionIds = attempt.questionOrder.map((q) => q.toString());
  const questions = await Question.find({ _id: { $in: questionIds.map(toObjectId) }, quiz: quiz._id }).lean();

  const questionsById = new Map(questions.map((q) => [q._id.toString(), q]));
  const answerMap = new Map(attempt.answers.map((a) => [a.questionId.toString(), a.selectedOptionId]));
  const optionOrderMap = new Map(attempt.optionOrders.map((o) => [o.questionId.toString(), o.optionOrder]));

  const reviewQuestions: ReviewQuestion[] = questionIds.map((id) => {
    const q = questionsById.get(id);
    if (!q) {
      return {
        id,
        question: "Question not found",
        options: [],
        marks: 0,
        negativeMarks: 0,
        selectedOptionId: answerMap.get(id) ?? null,
        correctOptionId: "",
        isCorrect: null,
        explanation: null,
      };
    }

    const selected = answerMap.get(id) ?? null;
    const isCorrect = selected === null ? null : selected === q.correctOptionId;
    const optionOrder = optionOrderMap.get(id) ?? q.options.map((o) => o.id);
    const optionById = new Map(q.options.map((o) => [o.id, o]));
    const options = optionOrder
      .map((oid) => optionById.get(oid))
      .filter((o): o is { id: string; text: string } => !!o);

    return {
      id: q._id.toString(),
      question: q.question,
      options,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      selectedOptionId: selected,
      correctOptionId: q.correctOptionId,
      isCorrect,
      explanation: q.explanation ?? null,
    };
  });

  return {
    id: attempt._id.toString(),
    studentId: student._id.toString(),
    studentName: student.name,
    studentEmail: student.email,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt.toISOString(),
    submittedAt: attempt.submittedAt?.toISOString() ?? null,
    status: attempt.status as QuizAttemptStatus,
    score: attempt.score,
    totalMarks: attempt.totalMarks,
    percentage: attempt.percentage,
    passed: attempt.passed,
    timeTakenSeconds: attempt.timeTakenSeconds ?? null,
    quizId: quiz._id.toString(),
    quizTitle: quiz.title,
    courseId: quiz.course.toString(),
    courseName: course?.name ?? "Unknown Course",
    type: quiz.type as OfficeQuizResultDetail["type"],
    questions: reviewQuestions,
  };
}