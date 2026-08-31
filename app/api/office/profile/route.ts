import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { OFFICE_ROLES } from "@/lib/constants";
import { getValidatedSession } from "@/lib/auth/helpers";

export async function PATCH(request: NextRequest) {
  try {
    const { user: session, error } = await getValidatedSession();
    if (!session || error) {
      return NextResponse.json(
        { success: false, error: error || "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user has an office role
    const isOfficeUser = session.role === "super_admin" ||
      session.role === "office_staff" ||
      session.role === "content_manager" ||
      session.role === "faculty";

    if (!isOfficeUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: session.id },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "This email is already in use." },
        { status: 409 }
      );
    }

    const user = await User.findByIdAndUpdate(
      session.id,
      {
        name: name.trim(),
        email: email.toLowerCase(),
      },
      { new: true }
    ).select("name email role status designation department employeeCode lastLoginAt lastOfficeLoginAt createdAt");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Profile updated successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office profile update error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}