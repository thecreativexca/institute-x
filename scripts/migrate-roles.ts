#!/usr/bin/env tsx
/**
 * Database Role Migration — two-role system
 *
 * Collapses every User role to the final two-role set:
 *
 *   "student"  (any casing / spacing) -> STUDENT (unchanged)
 *   everything else                    -> ADMIN
 *
 * Rationale: the legacy schema used SUPER_ADMIN / OFFICE_STAFF / CONTENT_MANAGER /
 * FACULTY / "super admin" / etc. — and in the two-role model ADMIN does all of
 * that work, so every non-student role collapses to ADMIN.
 *
 * Idempotent: safe to run multiple times. Never creates or deletes users.
 * Must be run if any legacy production rows still exist, otherwise the hard
 * two-role User enum will reject saves on those documents (e.g. "super admin").
 *
 * Usage:
 *   npx tsx scripts/migrate-roles.ts
 *
 * Safety:
 *   - Back up the database before running against a real dataset.
 *   - Set LEGACY_ROLE_MIGRATION_DRY_RUN=1 to preview changes without writing.
 */

import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/mongodb/models";
import type { UserRole } from "@/lib/constants";

const SUPPORTED_ROLES = new Set(["student", "admin"]);

const DRY_RUN = process.env.LEGACY_ROLE_MIGRATION_DRY_RUN === "1";

/**
 * Normalize an arbitrary stored role to the two-role vocabulary:
 * fold case, drop spaces/underscores/dashes, then map.
 *   - contains "student"       -> "student"
 *   - equals "admin"           -> "admin"
 *   - anything else (legacy)   -> "admin"
 */
function canonicalRole(raw: unknown): UserRole {
  const folded = String(raw ?? "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (folded.includes("student")) return "student";
  if (folded === "admin") return "admin";
  return "admin"; // SUPER_ADMIN, OFFICE_STAFF, CONTENT_MANAGER, FACULTY, super admin, …
}

async function migrateRoles() {
  await connectDB();

  const allUsers = await User.find({}, { role: 1, email: 1 }).lean();

  // 1. Inventory by normalized role.
  const inventory = new Map<string, number>();
  for (const u of allUsers) {
    const key = canonicalRole(u.role);
    inventory.set(key, (inventory.get(key) ?? 0) + 1);
  }

  console.log("📊 Current user role distribution:");
  for (const [role, count] of [...inventory.entries()].sort()) {
    console.log(`   ${role}: ${count}`);
  }
  console.log("");

  // 2. Identify rows whose stored role differs from the canonical target.
  const changes = allUsers.filter((u) => canonicalRole(u.role) !== u.role);

  console.log(`🗂️  Users needing migration: ${changes.length}`);

  if (changes.length === 0) {
    console.log("✅ Nothing to migrate — all existing roles are already ADMIN/STUDENT.");
    await User.db.close();
    return;
  }

  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN — no changes written. Would update:");
    for (const u of changes.slice(0, 50)) {
      console.log(`   ${u.email} : "${u.role}" -> "${canonicalRole(u.role)}"`);
    }
    if (changes.length > 50) {
      console.log(`   … and ${changes.length - 50} more`);
    }
    await User.db.close();
    return;
  }

  // 3. Migrate each row to its canonical role.
  const ops = changes.map((u) => ({
    updateOne: {
      filter: { _id: u._id },
      update: { $set: { role: canonicalRole(u.role) } },
    },
  }));
  const result = await User.bulkWrite(ops);
  console.log(`✍️  Updated ${result.modifiedCount} user(s).`);

  // 4. Verify no unsupported roles remain.
  const remaining = await User.find({}, { role: 1, email: 1 }).lean();
  const unsupported = remaining.filter(
    (u) => !SUPPORTED_ROLES.has(canonicalRole(u.role))
  );

  if (unsupported.length === 0) {
    console.log("✅ Verification passed: no production User has an unsupported legacy role.");
  } else {
    console.error(`❌ Verification FAILED: ${unsupported.length} user(s) still have an unsupported role:`);
    for (const u of unsupported.slice(0, 20)) {
      console.error(`   ${u.email} : "${u.role}"`);
    }
    await User.db.close();
    process.exitCode = 1;
    return;
  }

  console.log("");
  console.log("📊 Final user role distribution:");
  const finalInventory = new Map<string, number>();
  for (const u of remaining) {
    const key = canonicalRole(u.role);
    finalInventory.set(key, (finalInventory.get(key) ?? 0) + 1);
  }
  for (const [role, count] of [...finalInventory.entries()].sort()) {
    console.log(`   ${role}: ${count}`);
  }

  await User.db.close();
}

migrateRoles().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
