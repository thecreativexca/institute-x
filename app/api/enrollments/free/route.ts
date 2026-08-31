import { NextRequest, NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { enrollInFreeCourse } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const { user: student, error } = await getValidatedStudent();
    if (!student || error) {
      return NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    const result = await enrollInFreeCourse(student.id, courseId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Free enrollment failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, enrollmentId: result.enrollmentId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Free enrollment error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}