import { connectDB } from "@/lib/db/connect";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import { Course } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { AuditLog } from "@/models/AuditLog";
import { Types } from "mongoose";
import { QUIZ_TYPES, QUIZ_ATTEMPT_STATUSES, type QuizType } from "@/lib/constants";
import { CreateQuizInput, UpdateQuizInput, CreateQuestionInput, UpdateQuestionInput, ReorderQuestionsInput } from "./validation";

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

export async function createQuiz(
  input: CreateQuizInput,
  actorId: string,
  actorRole: string
): Promise<{ quizId: string } | { error: string }> {
  await connectDB();

  const course = await Course.findById(toObjectId(input.courseId)).lean();
  if (!course) return { error: "Course not found" };

  if (course.status !== "published") {
    return { error: "Cannot create quiz for unpublished course" };
  }

  if (input.moduleId) {
    const moduleDoc = await Module.findOne({
      _id: toObjectId(input.moduleId),
      course: toObjectId(input.courseId),
    }).lean();
    if (!moduleDoc) return { error: "Module not found in this course" };
  }

  if (input.lessonId) {
    const lesson = await Lesson.findOne({
      _id: toObjectId(input.lessonId),
      course: toObjectId(input.courseId),
    }).lean();
    if (!lesson) return { error: "Lesson not found in this course" };
    if (input.moduleId) {
      const lessonDoc = await Lesson.findById(toObjectId(input.lessonId)).lean();
      if (lessonDoc && !lessonDoc.module.equals(toObjectId(input.moduleId))) {
        return { error: "Lesson does not belong to the selected module" };
      }
    }
  }

  if (input.type === QUIZ_TYPES.MODULE && !input.moduleId) {
    return { error: "Module quizzes require a module" };
  }

  if (input.availableFrom && input.availableUntil) {
    if (new Date(input.availableUntil) <= new Date(input.availableFrom)) {
      return { error: "Available until must be after available from" };
    }
  }

  const quiz = await Quiz.create({
    course: toObjectId(input.courseId),
    module: input.moduleId ? toObjectId(input.moduleId) : undefined,
    lesson: input.lessonId ? toObjectId(input.lessonId) : undefined,
    title: input.title.trim(),
    description: input.description?.trim(),
    instructions: input.instructions?.trim(),
    type: input.type,
    durationMinutes: input.durationMinutes ?? null,
    passingPercentage: input.passingPercentage,
    totalMarks: 0,
    maxAttempts: input.maxAttempts ?? null,
    shuffleQuestions: input.shuffleQuestions,
    shuffleOptions: input.shuffleOptions,
    showCorrectAnswers: input.showCorrectAnswers,
    isPublished: input.isPublished ?? false,
    availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
    availableUntil: input.availableUntil ? new Date(input.availableUntil) : null,
  });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.create",
    entityType: "quiz",
    entityId: quiz._id,
    metadata: {
      courseId: input.courseId,
      moduleId: input.moduleId,
      lessonId: input.lessonId,
      title: input.title,
      type: input.type,
      isPublished: input.isPublished ?? false,
    },
  });

  if (input.isPublished) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "quiz.publish",
      entityType: "quiz",
      entityId: quiz._id,
      metadata: { title: input.title },
    });
  }

  return { quizId: quiz._id.toString() };
}

export async function updateQuiz(
  quizId: string,
  input: UpdateQuizInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const oldData = {
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    type: quiz.type,
    durationMinutes: quiz.durationMinutes,
    passingPercentage: quiz.passingPercentage,
    maxAttempts: quiz.maxAttempts,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showCorrectAnswers: quiz.showCorrectAnswers,
    availableFrom: quiz.availableFrom,
    availableUntil: quiz.availableUntil,
    module: quiz.module,
    lesson: quiz.lesson,
    isPublished: quiz.isPublished,
  };

  if (input.moduleId !== undefined) {
    if (input.moduleId) {
      const moduleDoc = await Module.findOne({
        _id: toObjectId(input.moduleId),
        course: quiz.course,
      }).lean();
      if (!moduleDoc) return { error: "Module not found in this course" };
      quiz.module = toObjectId(input.moduleId);
    } else {
      quiz.module = undefined;
    }
  }

  if (input.lessonId !== undefined) {
    if (input.lessonId) {
      const lesson = await Lesson.findOne({
        _id: toObjectId(input.lessonId),
        course: quiz.course,
      }).lean();
      if (!lesson) return { error: "Lesson not found in this course" };
      if (quiz.module) {
        const lessonDoc = await Lesson.findById(toObjectId(input.lessonId)).lean();
        if (lessonDoc && !lessonDoc.module.equals(quiz.module)) {
          return { error: "Lesson does not belong to the selected module" };
        }
      }
      quiz.lesson = toObjectId(input.lessonId);
    } else {
      quiz.lesson = undefined;
    }
  }

  if (input.type !== undefined) {
    if (input.type === QUIZ_TYPES.MODULE && !quiz.module && !input.moduleId) {
      return { error: "Module quizzes require a module" };
    }
    quiz.type = input.type;
  }

  if (input.title !== undefined) quiz.title = input.title.trim();
  if (input.description !== undefined) quiz.description = input.description?.trim();
  if (input.instructions !== undefined) quiz.instructions = input.instructions?.trim();
  if (input.durationMinutes !== undefined) quiz.durationMinutes = input.durationMinutes;
  if (input.passingPercentage !== undefined) quiz.passingPercentage = input.passingPercentage;
  if (input.maxAttempts !== undefined) quiz.maxAttempts = input.maxAttempts;
  if (input.shuffleQuestions !== undefined) quiz.shuffleQuestions = input.shuffleQuestions;
  if (input.shuffleOptions !== undefined) quiz.shuffleOptions = input.shuffleOptions;
  if (input.showCorrectAnswers !== undefined) quiz.showCorrectAnswers = input.showCorrectAnswers;
  if (input.availableFrom !== undefined) quiz.availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
  if (input.availableUntil !== undefined) quiz.availableUntil = input.availableUntil ? new Date(input.availableUntil) : null;

  if (input.isPublished !== undefined) {
    const wasPublished = quiz.isPublished;
    quiz.isPublished = input.isPublished;
    if (!wasPublished && input.isPublished) {
      await AuditLog.create({
        actorUserId: toObjectId(actorId),
        actorRole,
        action: "quiz.publish",
        entityType: "quiz",
        entityId: quiz._id,
        metadata: { title: quiz.title },
      });
    } else if (wasPublished && !input.isPublished) {
      await AuditLog.create({
        actorUserId: toObjectId(actorId),
        actorRole,
        action: "quiz.unpublish",
        entityType: "quiz",
        entityId: quiz._id,
        metadata: { title: quiz.title },
      });
    }
  }

  const changedFields: Record<string, { old: unknown; new: unknown }> = {};
  const checkChange = (field: string, oldVal: unknown, newVal: unknown) => {
    if (newVal !== undefined && oldVal !== newVal) {
      changedFields[field] = { old: oldVal, new: newVal };
    }
  };

  checkChange("title", oldData.title, input.title);
  checkChange("description", oldData.description, input.description);
  checkChange("instructions", oldData.instructions, input.instructions);
  checkChange("type", oldData.type, input.type);
  checkChange("durationMinutes", oldData.durationMinutes, input.durationMinutes);
  checkChange("passingPercentage", oldData.passingPercentage, input.passingPercentage);
  checkChange("maxAttempts", oldData.maxAttempts, input.maxAttempts);
  checkChange("shuffleQuestions", oldData.shuffleQuestions, input.shuffleQuestions);
  checkChange("shuffleOptions", oldData.shuffleOptions, input.shuffleOptions);
  checkChange("showCorrectAnswers", oldData.showCorrectAnswers, input.showCorrectAnswers);
  checkChange("availableFrom", oldData.availableFrom?.toISOString() ?? null, input.availableFrom);
  checkChange("availableUntil", oldData.availableUntil?.toISOString() ?? null, input.availableUntil);
  checkChange("module", oldData.module?.toString() ?? null, input.moduleId);
  checkChange("lesson", oldData.lesson?.toString() ?? null, input.lessonId);
  checkChange("isPublished", oldData.isPublished, input.isPublished);

  await quiz.save();

  if (Object.keys(changedFields).length > 0) {
    await AuditLog.create({
      actorUserId: toObjectId(actorId),
      actorRole,
      action: "quiz.update",
      entityType: "quiz",
      entityId: quiz._id,
      metadata: { changedFields },
    });
  }

  return { success: true };
}

export async function deleteQuiz(
  quizId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id });
  if (attemptCount > 0) {
    return { error: "Cannot delete quiz with existing attempts. Unpublish instead." };
  }

  await Question.deleteMany({ quiz: quiz._id });
  await quiz.deleteOne();

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.delete",
    entityType: "quiz",
    entityId: quiz._id,
    metadata: { title: quiz.title },
  });

  return { success: true };
}

export async function duplicateQuiz(
  quizId: string,
  actorId: string,
  actorRole: string
): Promise<{ quizId: string } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId))
    .populate([
      { path: "course", select: "name" },
      { path: "module", select: "title" },
      { path: "lesson", select: "title" },
    ])
    .lean();

  if (!quiz) return { error: "Quiz not found" };

  const questions = await Question.find({ quiz: quiz._id }).sort({ order: 1 }).lean();

  const newQuiz = await Quiz.create({
    course: quiz.course._id,
    module: quiz.module?._id ?? undefined,
    lesson: quiz.lesson?._id ?? undefined,
    title: `${quiz.title} (Copy)`,
    description: quiz.description,
    instructions: quiz.instructions,
    type: quiz.type,
    durationMinutes: quiz.durationMinutes,
    passingPercentage: quiz.passingPercentage,
    totalMarks: 0,
    maxAttempts: quiz.maxAttempts,
    shuffleQuestions: quiz.shuffleQuestions,
    shuffleOptions: quiz.shuffleOptions,
    showCorrectAnswers: quiz.showCorrectAnswers,
    isPublished: false,
    availableFrom: null,
    availableUntil: null,
  });

  const newQuestions = await Question.insertMany(
    questions.map((q, index) => ({
      quiz: newQuiz._id,
      question: q.question,
      options: q.options,
      correctOptionId: q.correctOptionId,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      explanation: q.explanation,
      order: q.order,
      isPublished: q.isPublished,
    }))
  );

  const totalMarks = newQuestions.reduce((sum, q) => sum + q.marks, 0);
  await Quiz.findByIdAndUpdate(newQuiz._id, { totalMarks });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.duplicate",
    entityType: "quiz",
    entityId: newQuiz._id,
    metadata: {
      originalQuizId: quiz._id.toString(),
      title: newQuiz.title,
      questionCount: newQuestions.length,
    },
  });

  return { quizId: newQuiz._id.toString() };
}

export async function createQuestion(
  quizId: string,
  input: CreateQuestionInput,
  actorId: string,
  actorRole: string
): Promise<{ questionId: string } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const hasAttempts = await QuizAttempt.exists({ quiz: quiz._id });
  if (hasAttempts && quiz.isPublished) {
    return { error: "Cannot add questions to a published quiz with attempts. Duplicate the quiz instead." };
  }

  const optionIds = input.options.map((o) => o.id);
  if (!optionIds.includes(input.correctOptionId)) {
    return { error: "Correct option ID must match one of the option IDs" };
  }
  if (new Set(optionIds).size !== optionIds.length) {
    return { error: "Option IDs must be unique" };
  }

  const question = await Question.create({
    quiz: quiz._id,
    question: input.question.trim(),
    options: input.options,
    correctOptionId: input.correctOptionId,
    marks: input.marks,
    negativeMarks: input.negativeMarks ?? 0,
    explanation: input.explanation?.trim(),
    order: input.order ?? 0,
    isPublished: input.isPublished ?? true,
  });

  const publishedQuestions = await Question.find({ quiz: quiz._id, isPublished: true }).lean();
  const totalMarks = publishedQuestions.reduce((sum, q) => sum + q.marks, 0);
  await Quiz.findByIdAndUpdate(quiz._id, { totalMarks });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.question.create",
    entityType: "question",
    entityId: question._id,
    metadata: {
      quizId: quiz._id.toString(),
      question: input.question,
      marks: input.marks,
      order: input.order ?? 0,
    },
  });

  return { questionId: question._id.toString() };
}

export async function updateQuestion(
  quizId: string,
  questionId: string,
  input: UpdateQuestionInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const question = await Question.findOne({ _id: toObjectId(questionId), quiz: quiz._id });
  if (!question) return { error: "Question not found" };

  const hasAttempts = await QuizAttempt.exists({ quiz: quiz._id });
  const isLocked = hasAttempts && quiz.isPublished;

  if (isLocked) {
    if (input.correctOptionId !== undefined && input.correctOptionId !== question.correctOptionId) {
      return { error: "Cannot change correct answer after quiz has attempts. Duplicate the quiz instead." };
    }
    if (input.marks !== undefined && input.marks !== question.marks) {
      return { error: "Cannot change marks after quiz has attempts. Duplicate the quiz instead." };
    }
    if (input.question !== undefined && input.question.trim() !== question.question) {
      return { error: "Cannot change question text after quiz has attempts. Duplicate the quiz instead." };
    }
    if (input.options !== undefined) {
      const oldOptionIds = question.options.map((o) => o.id);
      const newOptionIds = input.options.map((o) => o.id);
      if (JSON.stringify(oldOptionIds) !== JSON.stringify(newOptionIds)) {
        return { error: "Cannot change options after quiz has attempts. Duplicate the quiz instead." };
      }
    }
  }

  if (input.options !== undefined) {
    const optionIds = input.options.map((o) => o.id);
    if (!optionIds.includes(input.correctOptionId ?? question.correctOptionId)) {
      return { error: "Correct option ID must match one of the option IDs" };
    }
    if (new Set(optionIds).size !== optionIds.length) {
      return { error: "Option IDs must be unique" };
    }
    question.options = input.options;
  }

  if (input.question !== undefined) question.question = input.question.trim();
  if (input.correctOptionId !== undefined) question.correctOptionId = input.correctOptionId;
  if (input.marks !== undefined) question.marks = input.marks;
  if (input.negativeMarks !== undefined) question.negativeMarks = input.negativeMarks;
  if (input.explanation !== undefined) question.explanation = input.explanation?.trim();
  if (input.order !== undefined) question.order = input.order;
  if (input.isPublished !== undefined) question.isPublished = input.isPublished;

  await question.save();

  const publishedQuestions = await Question.find({ quiz: quiz._id, isPublished: true }).lean();
  const totalMarks = publishedQuestions.reduce((sum, q) => sum + q.marks, 0);
  await Quiz.findByIdAndUpdate(quiz._id, { totalMarks });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.question.update",
    entityType: "question",
    entityId: question._id,
    metadata: {
      quizId: quiz._id.toString(),
      isLocked,
    },
  });

  return { success: true };
}

export async function deleteQuestion(
  quizId: string,
  questionId: string,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const question = await Question.findOne({ _id: toObjectId(questionId), quiz: quiz._id });
  if (!question) return { error: "Question not found" };

  const hasAttempts = await QuizAttempt.exists({ quiz: quiz._id });
  if (hasAttempts) {
    return { error: "Cannot delete question after quiz has attempts. Archive the quiz instead." };
  }

  await question.deleteOne();

  const publishedQuestions = await Question.find({ quiz: quiz._id, isPublished: true }).lean();
  const totalMarks = publishedQuestions.reduce((sum, q) => sum + q.marks, 0);
  await Quiz.findByIdAndUpdate(quiz._id, { totalMarks });

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.question.delete",
    entityType: "question",
    entityId: question._id,
    metadata: {
      quizId: quiz._id.toString(),
    },
  });

  return { success: true };
}

export async function reorderQuestions(
  quizId: string,
  input: ReorderQuestionsInput,
  actorId: string,
  actorRole: string
): Promise<{ success: boolean } | { error: string }> {
  await connectDB();

  const quiz = await Quiz.findById(toObjectId(quizId));
  if (!quiz) return { error: "Quiz not found" };

  const hasAttempts = await QuizAttempt.exists({ quiz: quiz._id });
  if (hasAttempts && quiz.isPublished) {
    return { error: "Cannot reorder questions in a published quiz with attempts." };
  }

  const questionIds = input.questionOrders.map((q) => toObjectId(q.id));
  const questions = await Question.find({ _id: { $in: questionIds }, quiz: quiz._id }).lean();

  if (questions.length !== questionIds.length) {
    return { error: "One or more questions not found" };
  }

  const bulkOps = input.questionOrders.map((q) => ({
    updateOne: {
      filter: { _id: toObjectId(q.id), quiz: quiz._id },
      update: { $set: { order: q.order } },
    },
  }));

  await Question.bulkWrite(bulkOps);

  await AuditLog.create({
    actorUserId: toObjectId(actorId),
    actorRole,
    action: "quiz.question.reorder",
    entityType: "quiz",
    entityId: quiz._id,
    metadata: {
      questionOrders: input.questionOrders,
    },
  });

  return { success: true };
}

export async function getQuizPublishReadiness(
  quizId: string,
  userId: string,
  role: string
): Promise<{ ready: boolean; issues: string[] }> {
  await connectDB();

  const courseScope = await getUserCourseScope(userId, role);

  const quiz = await Quiz.findById(toObjectId(quizId)).lean();
  if (!quiz) return { ready: false, issues: ["Quiz not found"] };

  if (courseScope && courseScope.length > 0) {
    const hasAccess = courseScope.some((c) => c.equals(quiz.course));
    if (!hasAccess) return { ready: false, issues: ["Access denied"] };
  }

  const issues: string[] = [];

  if (!quiz.title.trim()) issues.push("Title is required");
  if (!quiz.type) issues.push("Quiz type is required");
  if (quiz.type === QUIZ_TYPES.MODULE && !quiz.module) issues.push("Module quizzes require a module");

  if (quiz.durationMinutes !== null && quiz.durationMinutes !== undefined) {
    if (quiz.durationMinutes < 1) issues.push("Duration must be at least 1 minute");
    if (quiz.durationMinutes > 600) issues.push("Duration cannot exceed 600 minutes");
  }

  if (quiz.passingPercentage < 0 || quiz.passingPercentage > 100) {
    issues.push("Passing percentage must be between 0 and 100");
  }

  if (quiz.availableFrom && quiz.availableUntil) {
    if (new Date(quiz.availableUntil) <= new Date(quiz.availableFrom)) {
      issues.push("Available until must be after available from");
    }
  }

  const publishedQuestions = await Question.find({ quiz: quiz._id, isPublished: true }).lean();
  if (publishedQuestions.length === 0) {
    issues.push("At least one published question is required");
  }

  for (const q of publishedQuestions) {
    if (!q.question.trim()) issues.push(`Question "${q._id}" has empty text`);
    if (q.options.length < 2) issues.push(`Question "${q._id}" needs at least 2 options`);
    if (!q.correctOptionId) issues.push(`Question "${q._id}" missing correct answer`);
    const optionIds = q.options.map((o) => o.id);
    if (!optionIds.includes(q.correctOptionId)) {
      issues.push(`Question "${q._id}" correct option ID doesn't match any option`);
    }
    if (q.marks < 1) issues.push(`Question "${q._id}" marks must be at least 1`);
  }

  const totalMarks = publishedQuestions.reduce((sum, q) => sum + q.marks, 0);
  if (totalMarks === 0) issues.push("Total marks must be greater than 0");

  return {
    ready: issues.length === 0,
    issues,
  };
}

export async function getQuizModules(courseId: string) {
  await connectDB();
  return Module.find({ course: toObjectId(courseId) }).select("title sortOrder").sort({ sortOrder: 1 }).lean();
}

export async function getModuleLessons(moduleId: string) {
  await connectDB();
  return Lesson.find({ module: toObjectId(moduleId), isPublished: true }).select("title sortOrder").sort({ sortOrder: 1 }).lean();
}

async function getUserCourseScope(userId: string, role: string): Promise<Types.ObjectId[] | null> {
  if (role === "super_admin" || role === "content_manager" || role === "office_staff") {
    return null;
  }
  if (role === "faculty") {
    const { FacultyCourseAssignment } = await import("@/models/FacultyCourseAssignment");
    const assignments = await FacultyCourseAssignment.find({ faculty: toObjectId(userId) })
      .select("course")
      .lean();
    return assignments.map((a) => a.course);
  }
  return [];
}