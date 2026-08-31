import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { USER_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { createSession } from "@/lib/auth/session";
import { TEST_ACCOUNTS, areTestAccountsEnabled, type TestRole } from "@/lib/dev/test-accounts";
import { recordAuditEvent } from "@/lib/audit/log";

const ALLOWED_TEST_ROLES: TestRole[] = [
  "STUDENT",
  "SUPER_ADMIN",
  "OFFICE_STAFF",
  "CONTENT_MANAGER",
  "FACULTY",
];

export async function POST(request: NextRequest) {
  // CRITICAL: Independent environment check - MUST be evaluated on every request
  if (!areTestAccountsEnabled()) {
    // Return 404 in production to avoid leaking existence of this endpoint
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { testRole } = body;

    // Validate testRole is provided and is allowed
    if (!testRole || typeof testRole !== "string") {
      return NextResponse.json(
        { success: false, error: "Test role is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TEST_ROLES.includes(testRole as TestRole)) {
      return NextResponse.json(
        { success: false, error: "Invalid test role" },
        { status: 400 }
      );
    }

    const role = testRole as TestRole;
    const testAccount = TEST_ACCOUNTS[role];

    if (!testAccount) {
      return NextResponse.json(
        { success: false, error: "Test account configuration not found" },
        { status: 404 }
      );
    }

    await connectDB();

    // Find the test account by email (server-defined, not client-provided)
    const user = await User.findOne({ email: testAccount.email.toLowerCase() }).select(
      "+passwordHash +sessionVersion"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Test account not found. Run the development test-account seed script.",
        },
        { status: 404 }
      );
    }

    // Verify this is one of our known test accounts (defense in depth)
    if (!user.email.endsWith("@test.local")) {
      return NextResponse.json(
        { success: false, error: "Invalid test account" },
        { status: 403 }
      );
    }

    // Verify account is active
    if (user.status !== ACCOUNT_STATUSES.ACTIVE) {
      let message = "Test account is not active.";
      if (user.status === ACCOUNT_STATUSES.SUSPENDED) {
        message = "Test account has been suspended.";
      } else if (user.status === ACCOUNT_STATUSES.INACTIVE) {
        message = "Test account is inactive.";
      }
      return NextResponse.json(
        { success: false, error: message },
        { status: 403 }
      );
    }

    // Verify role matches
    const expectedRole = USER_ROLES[role as keyof typeof USER_ROLES];
    if (user.role !== expectedRole) {
      return NextResponse.json(
        { success: false, error: "Test account role mismatch" },
        { status: 403 }
      );
    }

    // Create normal authenticated session using existing auth helper
    await createSession(user);

    // Optional: Audit log for development
    if (process.env.NODE_ENV !== "production") {
      try {
        await recordAuditEvent({
          actorUserId: user._id.toString(),
          actorRole: user.role,
          action: "dev.test_login",
          metadata: { testRole: role, email: user.email },
        });
      } catch {
        // Ignore audit logging errors in dev
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Logged in as ${testAccount.name}`,
        redirect: testAccount.redirectTo,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Dev test login error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
