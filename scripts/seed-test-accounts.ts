#!/usr/bin/env tsx
/**
 * Seed Test Accounts Script
 *
 * Creates deterministic development test accounts for all system roles.
 * This script is for development/testing convenience ONLY.
 * It MUST NOT run in production.
 *
 * Usage:
 *   ENABLE_TEST_ACCOUNTS=true npx tsx scripts/seed-test-accounts.ts
 *
 * The script will:
 * 1. Verify test accounts feature is enabled (NODE_ENV !== production && ENABLE_TEST_ACCOUNTS=true)
 * 2. Connect to MongoDB
 * 3. Upsert each test account (idempotent - no duplicates)
 * 4. Hash passwords correctly using production password hashing
 * 5. Set correct role, ACTIVE status, and email verified
 * 6. Print safe result summary (no password hashes)
 */

import { connectDB } from "@/lib/db/connect";
import { User, Course, FacultyCourseAssignment } from "@/lib/mongodb/models";
import { hashPassword } from "@/lib/auth/password";
import { USER_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { TEST_ACCOUNTS, areTestAccountsEnabled, type TestRole } from "@/lib/dev/test-accounts";

const TEST_PASSWORD = "Test@12345";

async function seedTestAccounts() {
  // Safety check: refuse to run in production
  if (!areTestAccountsEnabled()) {
    console.error("❌ Test accounts seeding is disabled.");
    console.error("   This script only runs when:");
    console.error("   - NODE_ENV !== 'production'");
    console.error("   - ENABLE_TEST_ACCOUNTS=true");
    console.error("");
    console.error("   Current environment:");
    console.error(`   NODE_ENV=${process.env.NODE_ENV}`);
    console.error(`   ENABLE_TEST_ACCOUNTS=${process.env.ENABLE_TEST_ACCOUNTS}`);
    process.exit(1);
  }

  console.log("🌱 Seeding development test accounts...");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    await connectDB();

    // Hash the test password once (using production hashing)
    const passwordHash = await hashPassword(TEST_PASSWORD);

    const results: Array<{
      role: TestRole;
      email: string;
      name: string;
      action: "created" | "updated" | "unchanged";
    }> = [];

    // Process each test account
    for (const [roleKey, config] of Object.entries(TEST_ACCOUNTS)) {
      const role = roleKey as TestRole;

      // Check if account already exists
      const existingUser = await User.findOne({ email: config.email.toLowerCase() });

      if (existingUser) {
        // Update safe testing fields if needed
        let needsUpdate = false;
        const updates: Record<string, unknown> = {};

        const expectedRole = USER_ROLES[role as keyof typeof USER_ROLES];
        if (existingUser.role !== expectedRole) {
          updates.role = expectedRole;
          needsUpdate = true;
        }
        if (existingUser.status !== ACCOUNT_STATUSES.ACTIVE) {
          updates.status = ACCOUNT_STATUSES.ACTIVE;
          needsUpdate = true;
        }
        if (!existingUser.emailVerifiedAt) {
          updates.emailVerifiedAt = new Date();
          needsUpdate = true;
        }
        // Always ensure password hash is correct for test accounts
        if (existingUser.passwordHash !== passwordHash) {
          updates.passwordHash = passwordHash;
          needsUpdate = true;
        }
        // Ensure sessionVersion exists
        if (existingUser.sessionVersion === undefined || existingUser.sessionVersion === null) {
          updates.sessionVersion = 1;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await User.findByIdAndUpdate(existingUser._id, { $set: updates });
          results.push({ role, email: config.email, name: config.name, action: "updated" });
          console.log(`🔄 Updated: ${config.name} (${config.email})`);
        } else {
          results.push({ role, email: config.email, name: config.name, action: "unchanged" });
          console.log(`✅ Exists:  ${config.name} (${config.email})`);
        }
      } else {
        // Create new test account
        await User.create({
          name: config.name,
          email: config.email.toLowerCase(),
          passwordHash,
          role: USER_ROLES[role as keyof typeof USER_ROLES],
          status: ACCOUNT_STATUSES.ACTIVE,
          emailVerifiedAt: new Date(),
          sessionVersion: 1,
        });
        results.push({ role, email: config.email, name: config.name, action: "created" });
        console.log(`✨ Created: ${config.name} (${config.email})`);
      }
    }

    // Print summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Seeding Summary:");
    console.log("");

    const created = results.filter((r) => r.action === "created").length;
    const updated = results.filter((r) => r.action === "updated").length;
    const unchanged = results.filter((r) => r.action === "unchanged").length;

    console.log(`   Created:   ${created}`);
    console.log(`   Updated:   ${updated}`);
    console.log(`   Unchanged: ${unchanged}`);
    console.log(`   Total:     ${results.length}`);
    console.log("");

    console.log("🔐 Test Credentials (same password for all):");
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log("");

    for (const result of results) {
      const config = TEST_ACCOUNTS[result.role];
      console.log(`   ${config.name}`);
      console.log(`     Role:    ${config.role}`);
      console.log(`     Email:   ${config.email}`);
      console.log(`     Redirect: ${config.redirectTo}`);
      console.log(`     Status:  ${result.action}`);
      console.log("");
    }

    console.log("⚠️  IMPORTANT:");
    console.log("   - These accounts are for DEVELOPMENT ONLY");
    console.log("   - Never enable ENABLE_TEST_ACCOUNTS in production");
    console.log("   - Test accounts use a known password for quick login");
    console.log("   - Use the Quick Login buttons on /login and /office/login");
    console.log("");

    // Optional: Create a sample FacultyCourseAssignment for test faculty
    // Only if there's at least one published course
    const publishedCourse = await Course.findOne({ status: "published" }).select("_id");
    if (publishedCourse) {
      const facultyUser = await User.findOne({ email: "faculty@test.local" });
      if (facultyUser) {
        const existingAssignment = await FacultyCourseAssignment.findOne({
          faculty: facultyUser._id,
          course: publishedCourse._id,
        });

        if (!existingAssignment) {
          await FacultyCourseAssignment.create({
            faculty: facultyUser._id,
            course: publishedCourse._id,
            assignedBy: facultyUser._id, // Self-assigned for test purposes
          });
          console.log("📚 Created FacultyCourseAssignment for Test Faculty");
          console.log(`   Course: ${publishedCourse._id}`);
        } else {
          console.log("📚 FacultyCourseAssignment already exists for Test Faculty");
        }
      }
    } else {
      console.log("ℹ️  No published courses found - skipping FacultyCourseAssignment");
    }

  } catch (error) {
    console.error("❌ Failed to seed test accounts:", error);
    process.exit(1);
  } finally {
    await User.db.close();
  }
}

seedTestAccounts();
