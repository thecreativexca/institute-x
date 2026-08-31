#!/usr/bin/env ts-node
/**
 * Bootstrap Super Admin Script
 *
 * Creates the initial Super Admin account for the Office Portal.
 * Run this script once during initial setup.
 *
 * Usage:
 *   INITIAL_ADMIN_EMAIL=admin@institute.edu.ts \
 *   INITIAL_ADMIN_PASSWORD=SecurePassword123 \
 *   INITIAL_ADMIN_NAME="Super Admin" \
 *   npx ts-node scripts/bootstrap-super-admin.ts
 *
 * The script will:
 * 1. Check if a SUPER_ADMIN already exists
 * 2. Validate the provided email
 * 3. Create the SUPER_ADMIN account with verified email
 * 4. Log the credentials (password only shown once)
 */

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { hashPassword } from "@/lib/auth/password";
import { USER_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";
import { Types } from "mongoose";

async function bootstrapSuperAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Super Admin";

  if (!email || !password) {
    console.error("❌ Missing required environment variables:");
    console.error("   INITIAL_ADMIN_EMAIL - Email for the super admin account");
    console.error("   INITIAL_ADMIN_PASSWORD - Strong password for the super admin account");
    console.error("   INITIAL_ADMIN_NAME (optional) - Display name for the super admin");
    process.exit(1);
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("❌ Invalid email format:", email);
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 8) {
    console.error("❌ Password must be at least 8 characters");
    process.exit(1);
  }

  if (password.length > 72) {
    console.error("❌ Password must be at most 72 characters");
    process.exit(1);
  }

  try {
    await connectDB();

    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      console.log("⚠️  A SUPER_ADMIN account already exists:");
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Name: ${existingSuperAdmin.name}`);
      console.log(`   Created: ${existingSuperAdmin.createdAt}`);
      console.log("\n❌ Refusing to create another SUPER_ADMIN. Only one should exist.");
      console.log("   If you need to reset the super admin, do it manually in the database.");
      process.exit(1);
    }

    // Check if email is already used
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error(`❌ An account with email "${email}" already exists.`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create super admin user
    const superAdmin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.SUPER_ADMIN,
      status: ACCOUNT_STATUSES.ACTIVE,
      emailVerifiedAt: new Date(), // Pre-verified for bootstrap
      sessionVersion: 1,
    });

    console.log("✅ Super Admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name:      ${superAdmin.name}`);
    console.log(`Email:     ${superAdmin.email}`);
    console.log(`Role:      ${superAdmin.role}`);
    console.log(`Status:    ${superAdmin.status}`);
    console.log(`Verified:  Yes (emailVerifiedAt set)`);
    console.log(`ID:        ${superAdmin._id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("🔐 Credentials (shown only once):");
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log("");
    console.log("⚠️  IMPORTANT: Save these credentials securely. The password will not be shown again.");
    console.log("");
    console.log("🌐 Access the Office Portal at: /office/login");
    console.log("");

  } catch (error) {
    console.error("❌ Failed to create Super Admin:", error);
    process.exit(1);
  } finally {
    await User.db.close();
  }
}

// Run the bootstrap
bootstrapSuperAdmin();