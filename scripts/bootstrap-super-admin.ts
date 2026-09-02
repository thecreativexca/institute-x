#!/usr/bin/env ts-node
/**
 * Bootstrap Admin Script
 *
 * Creates the initial ADMIN account for the Office/Admin Portal.
 * Run this script once during initial setup. There is no public admin
 * registration — this is the only supported way to create an admin.
 *
 * Usage:
 *   INITIAL_ADMIN_EMAIL=admin@institute.edu \
 *   INITIAL_ADMIN_PASSWORD=SecurePassword123 \
 *   INITIAL_ADMIN_NAME="Institute Admin" \
 *   npx ts-node scripts/bootstrap-super-admin.ts
 *
 * The script will:
 * 1. Check if an ADMIN already exists
 * 2. Validate the provided email
 * 3. Create the ADMIN account with verified email
 * 4. Log the credentials (password only shown once)
 */

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import { hashPassword } from "@/lib/auth/password";
import { USER_ROLES, ACCOUNT_STATUSES } from "@/lib/constants";

async function bootstrapAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const name = process.env.INITIAL_ADMIN_NAME || "Institute Admin";

  if (!email || !password) {
    console.error("❌ Missing required environment variables:");
    console.error("   INITIAL_ADMIN_EMAIL - Email for the admin account");
    console.error("   INITIAL_ADMIN_PASSWORD - Strong password for the admin account");
    console.error("   INITIAL_ADMIN_NAME (optional) - Display name for the admin");
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

    // Check if any ADMIN already exists
    const existingAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
    if (existingAdmin) {
      console.log("⚠️  An ADMIN account already exists:");
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log("\n❌ Refusing to create another ADMIN.");
      console.log("   If you need to reset the admin, do it manually in the database.");
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

    // Create admin user
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: USER_ROLES.ADMIN,
      status: ACCOUNT_STATUSES.ACTIVE,
      emailVerifiedAt: new Date(), // Pre-verified for bootstrap
      sessionVersion: 1,
    });

    console.log("✅ Admin created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Name:      ${admin.name}`);
    console.log(`Email:     ${admin.email}`);
    console.log(`Role:      ${admin.role}`);
    console.log(`Status:    ${admin.status}`);
    console.log(`Verified:  Yes (emailVerifiedAt set)`);
    console.log(`ID:        ${admin._id}`);
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
    console.error("❌ Failed to create Admin:", error);
    process.exit(1);
  } finally {
    await User.db.close();
  }
}

// Run the bootstrap
bootstrapAdmin();
