import { USER_ROLES } from "@/lib/constants";

export interface TestAccountConfig {
  email: string;
  name: string;
  role: keyof typeof USER_ROLES;
  redirectTo: string;
  description: string;
}

export const TEST_ACCOUNTS = {
  STUDENT: {
    email: "student@test.local",
    name: "Test Student",
    role: "STUDENT",
    redirectTo: "/student/dashboard",
    description: "Student LMS Access",
  },
  ADMIN: {
    email: "admin@test.local",
    name: "Test Admin",
    role: "ADMIN",
    redirectTo: "/office",
    description: "Admin Office Access",
  },
} as const satisfies Record<string, TestAccountConfig>;

export type TestRole = keyof typeof TEST_ACCOUNTS;

export const STUDENT_TEST_ROLES: TestRole[] = ["STUDENT"];
export const OFFICE_TEST_ROLES: TestRole[] = ["ADMIN"];

export function areTestAccountsEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_TEST_ACCOUNTS === "true"
  );
}

export function getTestAccount(role: TestRole): TestAccountConfig | undefined {
  return TEST_ACCOUNTS[role];
}

export function getTestAccountByEmail(email: string): TestAccountConfig | undefined {
  const normalizedEmail = email.toLowerCase().trim();
  return Object.values(TEST_ACCOUNTS).find(
    (account) => account.email.toLowerCase() === normalizedEmail
  );
}

export function isTestAccountEmail(email: string): boolean {
  return getTestAccountByEmail(email) !== undefined;
}
