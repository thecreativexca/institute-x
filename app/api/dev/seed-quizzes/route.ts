import { NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { Course, type ICourse } from "@/models/Course";
import { Module } from "@/models/Module";
import { Lesson } from "@/models/Lesson";
import { Quiz } from "@/models/Quiz";
import { Question } from "@/models/Question";

/**
 * DEVELOPMENT-ONLY seed for the Phase 10 quiz system.
 *
 * Creates clearly-marked sample quiz data (no fake student results) so the
 * quiz flow can be exercised locally. This route is disabled in production.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Seed route disabled in production." },
      { status: 403 }
    );
  }

  await connectDB();

  // 1. Find the "Web Development" course (or the first published course).
  let course = (await Course.findOne({ slug: "web-development" }).lean()) as
    | ICourse
    | null;
  if (!course) {
    course = (await Course.findOne({
      status: "published",
      isDisplayed: true,
    }).lean()) as ICourse | null;
  }

  if (!course) {
    return NextResponse.json(
      {
        success: false,
        error:
          "No published course found. Seed quiz data requires at least one course.",
      },
      { status: 400 }
    );
  }

  const courseId = course._id;

  // 2. Find or create a sample module + lesson.
  const moduleDoc = await Module.findOneAndUpdate(
    { course: courseId, title: { $regex: /^JavaScript/i } },
    {
      $setOnInsert: {
        title: "JavaScript Essentials",
        sortOrder: 1,
        course: courseId,
      },
    },
    { new: true, upsert: true }
  );

  const lesson = await Lesson.findOneAndUpdate(
    { course: courseId, title: { $regex: /^What is JavaScript/i } },
    {
      $setOnInsert: {
        title: "What is JavaScript?",
        contentType: "text",
        module: moduleDoc._id,
        course: courseId,
        sortOrder: 1,
        isPreview: false,
      },
    },
    { new: true, upsert: true }
  );

  // 3. Module quiz — JavaScript Fundamentals Test.
  const moduleQuiz = await Quiz.findOneAndUpdate(
    { course: courseId, title: "JavaScript Fundamentals Test" },
    {
      $set: {
        course: courseId,
        module: moduleDoc._id,
        lesson: null,
        title: "JavaScript Fundamentals Test",
        description:
          "Test your understanding of core JavaScript concepts covered in the JavaScript Essentials module.",
        instructions:
          "Read each question carefully before submitting. No negative marking.",
        type: "module",
        durationMinutes: 10,
        passingPercentage: 40,
        totalMarks: 0,
        maxAttempts: 3,
        shuffleQuestions: false,
        shuffleOptions: true,
        showCorrectAnswers: true,
        isPublished: true,
        availableFrom: null,
        availableUntil: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // 4. Final course test.
  const finalQuiz = await Quiz.findOneAndUpdate(
    { course: courseId, type: "final", title: "Web Development Final Test" },
    {
      $set: {
        course: courseId,
        module: null,
        lesson: null,
        title: "Web Development Final Test",
        description: "Final assessment covering the whole Web Development course.",
        instructions:
          "This is the final assessment. Ensure you have completed all modules.",
        type: "final",
        durationMinutes: 20,
        passingPercentage: 50,
        totalMarks: 0,
        maxAttempts: 2,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswers: false,
        isPublished: true,
        availableFrom: null,
        availableUntil: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // 5. Upsert module quiz questions (5 sample MCQs).
  const moduleQuestions: Array<{
    question: string;
    options: { id: string; text: string }[];
    correct: string;
    marks: number;
    order: number;
    explanation?: string;
  }> = [
    {
      question: "What is JavaScript primarily used for?",
      options: [
        { id: "a", text: "Styling web pages" },
        { id: "b", text: "Adding behavior and interactivity to web pages" },
        { id: "c", text: "Structuring web page content" },
        { id: "d", text: "Managing databases only" },
      ],
      correct: "b",
      marks: 2,
      order: 1,
      explanation:
        "JavaScript is a programming language used to add behavior and interactivity to web pages.",
    },
    {
      question: "Which keyword declares a constant in JavaScript?",
      options: [
        { id: "a", text: "let" },
        { id: "b", text: "var" },
        { id: "c", text: "const" },
        { id: "d", text: "static" },
      ],
      correct: "c",
      marks: 2,
      order: 2,
      explanation: "'const' declares a constant binding that cannot be reassigned.",
    },
  ];

  for (const q of moduleQuestions) {
    await Question.findOneAndUpdate(
      {
        quiz: moduleQuiz._id,
        question: q.question,
      },
      {
        $set: {
          quiz: moduleQuiz._id,
          question: q.question,
          options: q.options,
          correctOptionId: q.correct,
          marks: q.marks,
          negativeMarks: 0,
          explanation: q.explanation,
          order: q.order,
          isPublished: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }


  // Additional module quiz questions (3-5).
  const moduleQuestionsExtra: typeof moduleQuestions = [
    {
      question: "Which method converts a JSON string into a JavaScript object?",
      options: [
        { id: "a", text: "JSON.stringify()" },
        { id: "b", text: "JSON.parse()" },
        { id: "c", text: "Object.toString()" },
        { id: "d", text: "Array.from()" },
      ],
      correct: "b",
      marks: 2,
      order: 3,
      explanation: "JSON.parse() parses a JSON string and returns a JavaScript object.",
    },
    {
      question: "What does the strict equality operator (===) compare?",
      options: [
        { id: "a", text: "Value only" },
        { id: "b", text: "Reference only" },
        { id: "c", text: "Value and type" },
        { id: "d", text: "Memory address" },
      ],
      correct: "c",
      marks: 2,
      order: 4,
      explanation: "'===' compares both value and type without type coercion.",
    },
    {
      question: "Which data type represents a true/false value in JavaScript?",
      options: [
        { id: "a", text: "number" },
        { id: "b", text: "string" },
        { id: "c", text: "boolean" },
        { id: "d", text: "object" },
      ],
      correct: "c",
      marks: 2,
      order: 5,
      explanation: "A boolean represents the logical values true or false.",
    },
  ];

  for (const q of moduleQuestionsExtra) {
    await Question.findOneAndUpdate(
      { quiz: moduleQuiz._id, question: q.question },
      {
        $set: {
          quiz: moduleQuiz._id,
          question: q.question,
          options: q.options,
          correctOptionId: q.correct,
          marks: q.marks,
          negativeMarks: 0,
          explanation: q.explanation,
          order: q.order,
          isPublished: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  // 6. Two sample questions for the final test (shuffled + no answer review).
  const finalQuestions: Array<{
    question: string;
    options: { id: string; text: string }[];
    correct: string;
    marks: number;
    order: number;
    explanation?: string;
  }> = [
    {
      question: "Which HTML tag is used to create a hyperlink?",
      options: [
        { id: "a", text: "<a>" },
        { id: "b", text: "<link>" },
        { id: "c", text: "<href>" },
        { id: "d", text: "<url>" },
      ],
      correct: "a",
      marks: 2,
      order: 1,
      explanation: "The <a> (anchor) tag creates hyperlinks.",
    },
    {
      question: "Which property is used to change the background color in CSS?",
      options: [
        { id: "a", text: "color" },
        { id: "b", text: "bgcolor" },
        { id: "c", text: "background-color" },
        { id: "d", text: "font-color" },
      ],
      correct: "c",
      marks: 2,
      order: 2,
      explanation: "background-color sets the background color of an element.",
    },
  ];

  for (const q of finalQuestions) {
    await Question.findOneAndUpdate(
      { quiz: finalQuiz._id, question: q.question },
      {
        $set: {
          quiz: finalQuiz._id,
          question: q.question,
          options: q.options,
          correctOptionId: q.correct,
          marks: q.marks,
          negativeMarks: 0,
          explanation: q.explanation,
          order: q.order,
          isPublished: true,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  // 7. Sync cached totalMarks on both quizzes.
  for (const quiz of [moduleQuiz, finalQuiz]) {
    const total = await Question.aggregate<{ total: number }>([
      { $match: { quiz: quiz._id, isPublished: true } },
      { $group: { _id: null, total: { $sum: "$marks" } } },
    ]);
    const totalMarks = total.length ? total[0].total : 0;
    await Quiz.updateOne({ _id: quiz._id }, { $set: { totalMarks } });
  }

  return NextResponse.json(
    {
      success: true,
      message: `Seeded sample quiz data (module: ${
        moduleQuestions.length + moduleQuestionsExtra.length
      } questions, final: ${finalQuestions.length} questions).`,
      course: {
        id: courseId.toString(),
        name: course.name,
      },
      quizzes: {
        module: moduleQuiz._id.toString(),
        final: finalQuiz._id.toString(),
      },
    },
    { status: 201 }
  );
}

