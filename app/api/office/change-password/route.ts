import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { OFFICE_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { getValidatedSession } from "@/lib/auth/helpers";
import { destroySession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Current and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (newPassword.length > 72) {
      return NextResponse.json(
        { success: false, error: "New password must be at most 72 characters." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: "New password must be different from current password." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.id).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Check if user has an office role
    const isOfficeUserCheck = user.role === "super_admin" ||
      user.role === "office_staff" ||
      user.role === "content_manager" ||
      user.role === "faculty";

    if (!isOfficeUserCheck) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      return NextResponse.json(
        { success: false, error: "This account is not active." },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(currentPassword ?? "", user.passwordHash ?? "");
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    user.passwordHash = await hashPassword(newPassword);
    user.sessionVersion += 1; // Invalidate existing sessions
    await user.save();

    // Destroy current session - user will need to log in again
    await destroySession();

    return NextResponse.json(
      { success: true, message: "Password changed successfully. Please log in again." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Office change password error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}