import { NextRequest, NextResponse } from "next/server";

import { getValidatedStudent } from "@/lib/auth/helpers";
import { createCoursePaymentOrder } from "@/lib/payments/service";

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

    const result = await createCoursePaymentOrder(student.id, courseId);

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    console.error("Create payment order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    const status = message.includes("already enrolled") ? 409 : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}