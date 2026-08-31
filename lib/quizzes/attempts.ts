import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import {
  QUIZ_ATTEMPT_STATUSES,
  type QuizAttemptStatus,
} from "@/lib/constants";
import { Quiz, type IQuiz } from "@/models/Quiz";
import { Question, type IQuestion } from "@/models/Question";
import { QuizAttempt } from "@/models/QuizAttempt";
import {
  assertQuizAccessForStudent,
  assertQuizHasQuestions,
  availabilityOf,
  toObjectId,
} from "./access";
import { QuizError } from "./errors";
import { evaluateAttempt } from "./scoring";
import { QUIZ_ACCESS_ERROR, type AttemptForEvaluation } from "./types";
import { submitAttemptSchema } from "./validation";

type SubmitReason = "manual" | "expired";

interface RawQuestionId {
  toString(): string;
}
interface RawAnswer {
  questionId: RawQuestionId;
  selectedOptionId: string;
}
interface RawOptionOrder {
  questionId: RawQuestionId;
  optionOrder: string[];
}

/** Lean QuizAttempt document (used only for reads/guards inside this module). */
export interface RawAttempt {
  _id: Types.ObjectId;
  quiz: Types.ObjectId;
  student: Types.ObjectId;
  course: Types.ObjectId;
  startedAt: Date;
  submittedAt: Date | null;
  status: string;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  attemptNumber: number;
  answers: RawAnswer[];
  questionOrder: RawQuestionId[];
  optionOrders: RawOptionOrder[];
  timeTakenSeconds: number | null;
  createdAt: Date;
}

function shuffleArray<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function deadlineMs(attempt: RawAttempt, quiz: IQuiz): number | null {
  if (quiz.durationMinutes == null) return null;
  return attempt.startedAt.getTime() + quiz.durationMinutes * 60 * 1000;
}

/**
 * Finalizes an IN_PROGRESS attempt: evaluates answers server-side and marks
 * it SUBMITTED or EXPIRED. Idempotent per attempt (guarded by status).
 */
async function finalizeAttempt(
  attempt: RawAttempt,
  quiz: IQuiz,
  reason: SubmitReason
): Promise<void> {
  const now = new Date();
  const deadline = deadlineMs(attempt, quiz);
  const expired = reason === "expired" && deadline !== null;
  const isExpired =
    (deadline !== null && now.getTime() >= deadline) || expired;
  const status: QuizAttemptStatus = isExpired
    ? QUIZ_ATTEMPT_STATUSES.EXPIRED
    : QUIZ_ATTEMPT_STATUSES.SUBMITTED;

  const questions = (await Question.find({
    quiz: quiz._id,
    isPublished: true,
  }).lean()) as unknown as IQuestion[];

  const evaluation = evaluateAttempt(
    attempt as unknown as AttemptForEvaluation,
    questions,
    quiz.passingPercentage
  );
  const timeTakenSeconds = Math.max(
    0,
    Math.round((now.getTime() - attempt.startedAt.getTime()) / 1000)
  );

  // Atomic guard: only finalize a still-IN_PROGRESS attempt, so a double
  // submission or a race with auto-expiry can never double-evaluate.
  await QuizAttempt.updateOne(
    { _id: attempt._id, status: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS },
    {
      $set: {
        status,
        submittedAt: now,
        score: evaluation.score,
        totalMarks: evaluation.totalMarks,
        percentage: evaluation.percentage,
        passed: evaluation.passed,
        timeTakenSeconds,
      },
    }
  );

  // Keep the displayed quiz.totalMarks cache in sync with live question marks.
  if (quiz.totalMarks !== evaluation.totalMarks) {
    await Quiz.updateOne(
      { _id: quiz._id },
      { $set: { totalMarks: evaluation.totalMarks } }
    );
  }
}

/**
 * Starts a new attempt (or resumes a still-valid in-progress one).
 * Server-authoritative: attempt number, question order and option order are
 * all decided here. `studentId` comes from the session, never the client.
 */
export async function startQuizAttempt(
  studentId: string,
  quizId: string
): Promise<{ quizId: string; attemptId: string }> {
  await connectDB();
  const studentObjectId = toObjectId(studentId);
  const quizObjectId = toObjectId(quizId);

  const quiz = (await Quiz.findById(quizObjectId).lean()) as unknown as IQuiz;
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }
  await assertQuizAccessForStudent(studentId, quiz);
  if (!quiz.isPublished || availabilityOf(quiz) !== "available") {
    throw new QuizError(
      !quiz.isPublished
        ? QUIZ_ACCESS_ERROR.NOT_PUBLISHED
        : QUIZ_ACCESS_ERROR.NO_LONGER_AVAILABLE,
      !quiz.isPublished
        ? "This test is not available."
        : "This test is no longer available."
    );
  }
  await assertQuizHasQuestions(quizId);

  // Resume an existing in-progress attempt if it is still within its time.
  const existing = (await QuizAttempt.findOne({
    quiz: quizObjectId,
    student: studentObjectId,
    status: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS,
  }).lean()) as unknown as RawAttempt | null;

  if (existing) {
    const deadline = deadlineMs(existing, quiz);
    if (deadline === null || Date.now() < deadline) {
      return { quizId, attemptId: existing._id.toString() };
    }
    // The in-progress attempt has expired: finalize it before starting a new one.
    await finalizeAttempt(existing, quiz, "expired");
  }

  // Enforce attempt limit (only submitted/expired attempts count).
  const submittedCount = await QuizAttempt.countDocuments({
    quiz: quizObjectId,
    student: studentObjectId,
    status: {
      $in: [
        QUIZ_ATTEMPT_STATUSES.SUBMITTED,
        QUIZ_ATTEMPT_STATUSES.EXPIRED,
      ],
    },
  });

  if (quiz.maxAttempts != null && submittedCount >= quiz.maxAttempts) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_LIMIT,
      "You have used all available attempts."
    );
  }

  const attemptNumber = submittedCount + 1;

  // Determine question order (shuffled or configured order).
  const publishedQuestions = (await Question.find({
    quiz: quizObjectId,
    isPublished: true,
  })
    .sort({ order: 1 })
    .lean()) as unknown as IQuestion[];

  const orderedIds = publishedQuestions.map((q) => q._id);
  const questionOrder = quiz.shuffleQuestions
    ? shuffleArray(orderedIds)
    : orderedIds;

  // Determine per-question option order (shuffled or configured order).
  const optionOrders = publishedQuestions.map((q) => ({
    questionId: q._id,
    optionOrder: quiz.shuffleOptions
      ? shuffleArray(q.options.map((o) => o.id))
      : q.options.map((o) => o.id),
  }));

  const attempt = await QuizAttempt.create({
    quiz: quizObjectId,
    student: studentObjectId,
    course: quiz.course,
    startedAt: new Date(),
    submittedAt: null,
    status: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS,
    score: 0,
    totalMarks: 0,
    percentage: 0,
    passed: false,
    attemptNumber,
    answers: [],
    questionOrder,
    optionOrders,
    timeTakenSeconds: null,
  });

  return { quizId, attemptId: attempt._id.toString() };
}

/**
 * Persists (or changes) a student's answer to a single question.
 * Validates ownership, question membership and option membership server-side.
 * Rejects writes once the attempt is finalized or expired.
 */
export async function saveAttemptAnswer(args: {
  studentId: string;
  quizId: string;
  attemptId: string;
  questionId: string;
  selectedOptionId: string;
}): Promise<void> {
  const { studentId, quizId, attemptId, questionId, selectedOptionId } = args;
  await connectDB();
  const studentObjectId = toObjectId(studentId);
  const attemptObjectId = toObjectId(attemptId);

  const attempt = (await QuizAttempt.findOne({
    _id: attemptObjectId,
    student: studentObjectId,
  }).lean()) as unknown as RawAttempt | null;

  if (!attempt || attempt.quiz.toString() !== quizId) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND,
      "Attempt not found."
    );
  }
  if (attempt.status !== QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_INVALID,
      "This attempt can no longer be edited."
    );
  }

  const quiz = (await Quiz.findById(attempt.quiz).lean()) as unknown as IQuiz;
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }

  // Expiry: if time is up, finalize and reject further edits.
  const deadline = deadlineMs(attempt, quiz);
  if (deadline !== null && Date.now() >= deadline) {
    await finalizeAttempt(attempt, quiz, "expired");
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_EXPIRED,
      "Test time has expired."
    );
  }

  // The question must belong to this attempt.
  if (!attempt.questionOrder.some((q) => q.toString() === questionId)) {
    throw new QuizError(QUIZ_ACCESS_ERROR.INVALID_QUESTION, "Invalid question.");
  }

  // Load the question and verify the option belongs to it.
  const question = (await Question.findOne({
    _id: toObjectId(questionId),
    quiz: attempt.quiz,
  }).lean()) as unknown as IQuestion | null;

  if (!question || !question.isPublished) {
    throw new QuizError(QUIZ_ACCESS_ERROR.INVALID_QUESTION, "Invalid question.");
  }
  if (!question.options.some((o) => o.id === selectedOptionId)) {
    throw new QuizError(QUIZ_ACCESS_ERROR.INVALID_OPTION, "Invalid option.");
  }

  // Upsert the answer atomically. The status guard ensures we never mutate a
  // finalized attempt that became immutable between our read and this write.
  const result = await QuizAttempt.updateOne(
    {
      _id: attemptObjectId,
      student: studentObjectId,
      status: QUIZ_ATTEMPT_STATUSES.IN_PROGRESS,
    },
    [
      {
        $set: {
          answers: {
            $let: {
              vars: {
                others: {
                  $filter: {
                    input: "$answers",
                    as: "a",
                    cond: { $ne: ["$$a.questionId", toObjectId(questionId)] },
                  },
                },
              },
              in: {
                $concatArrays: [
                  "$$others",
                  [{ questionId: toObjectId(questionId), selectedOptionId }],
                ],
              },
            },
          },
        },
      },
    ]
  );

  if (result.modifiedCount === 0) {
    const rel = await QuizAttempt.findById(attemptObjectId).select("status").lean();
    if (rel && rel.status !== QUIZ_ATTEMPT_STATUSES.IN_PROGRESS) {
      throw new QuizError(
        QUIZ_ACCESS_ERROR.ATTEMPT_INVALID,
        "This attempt can no longer be edited."
      );
    }
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND,
      "Attempt not found."
    );
  }
}

/**
 * Submits an attempt (manual or due to expiry). Idempotent: a second call for
 * an already-finalized attempt does not re-evaluate or overwrite anything.
 */
export async function submitQuizAttempt(args: {
  studentId: string;
  quizId: string;
  attemptId: string;
  reason?: SubmitReason;
}): Promise<{ quizId: string; attemptId: string; status: string }> {
  const reason = submitAttemptSchema.parse({
    reason: args.reason ?? "manual",
  }).reason;
  await connectDB();
  const studentObjectId = toObjectId(args.studentId);
  const attemptObjectId = toObjectId(args.attemptId);

  const attempt = (await QuizAttempt.findOne({
    _id: attemptObjectId,
    student: studentObjectId,
  }).lean()) as unknown as RawAttempt | null;

  if (!attempt || attempt.quiz.toString() !== args.quizId) {
    throw new QuizError(
      QUIZ_ACCESS_ERROR.ATTEMPT_NOT_FOUND,
      "Attempt not found."
    );
  }

  // Idempotency: already finalized — return without re-evaluating.
  if (
    attempt.status === QUIZ_ATTEMPT_STATUSES.SUBMITTED ||
    attempt.status === QUIZ_ATTEMPT_STATUSES.EXPIRED
  ) {
    return {
      quizId: args.quizId,
      attemptId: args.attemptId,
      status: attempt.status,
    };
  }

  const quiz = (await Quiz.findById(attempt.quiz).lean()) as unknown as IQuiz;
  if (!quiz) {
    throw new QuizError(QUIZ_ACCESS_ERROR.QUIZ_NOT_FOUND, "Test not found.");
  }

  await finalizeAttempt(attempt, quiz, reason);

  return { quizId: args.quizId, attemptId: args.attemptId, status: "finalized" };
}


