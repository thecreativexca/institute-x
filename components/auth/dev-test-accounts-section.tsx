import "server-only";

import {
  TEST_ACCOUNTS,
  STUDENT_TEST_ROLES,
  OFFICE_TEST_ROLES,
  areTestAccountsEnabled,
  type TestRole,
} from "@/lib/dev/test-accounts";
import { TestAccountLogin, type TestAccountRoleItem } from "./test-account-login";

/**
 * Shared development password for all seeded test accounts. Kept server-only so
 * it never reaches the production client bundle.
 */
const TEST_PASSWORD = "Test@12345";

interface DevTestAccountsSectionProps {
  /** "student" <-> only the STUDENT account; "office" <-> office roles; "all" <-> every test account. */
  mode: "student" | "office" | "all";
}

/**
 * Server Component that conditionally renders the quick-login test accounts UI.
 *
 * It independently verifies the environment before rendering anything. In
 * production (or when ENABLE_TEST_ACCOUNTS !== "true") it returns null, so the
 * test UI — including test emails and the shared password — is never rendered
 * and never serialized to the client.
 */
export function DevTestAccountsSection({ mode }: DevTestAccountsSectionProps) {
  if (!areTestAccountsEnabled()) {
    return null;
  }

  const roleKeys: TestRole[] =
    mode === "student" ? STUDENT_TEST_ROLES : mode === "office" ? OFFICE_TEST_ROLES : (Object.keys(TEST_ACCOUNTS) as TestRole[]);

  const roles: TestAccountRoleItem[] = roleKeys.map((key) => {
    const account = TEST_ACCOUNTS[key];
    return {
      key,
      name: account.name,
      email: account.email,
      description: account.description,
      role: account.role,
    };
  });

  return (
    <TestAccountLogin
      title={mode === "student" ? "Developer Test Account" : "Developer Test Accounts"}
      roles={roles}
      password={TEST_PASSWORD}
    />
  );
}