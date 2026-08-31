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
  SUPER_ADMIN: {
    email: "superadmin@test.local",
    name: "Test Super Admin",
    role: "SUPER_ADMIN",
    redirectTo: "/office",
    description: "Full Office Access",
  },
  OFFICE_STAFF: {
    email: "office@test.local",
    name: "Test Office Staff",
    role: "OFFICE_STAFF",
    redirectTo: "/office",
    description: "Operational Access",
  },
  CONTENT_MANAGER: {
    email: "content@test.local",
    name: "Test Content Manager",
    role: "CONTENT_MANAGER",
    redirectTo: "/office",
    description: "Course & Content Access",
  },
  FACULTY: {
    email: "faculty@test.local",
    name: "Test Faculty",
    role: "FACULTY",
    redirectTo: "/office",
    description: "Assigned Course Access",
  },
} as const satisfies Record<string, TestAccountConfig>;

export type TestRole = keyof typeof TEST_ACCOUNTS;

export const STUDENT_TEST_ROLES: TestRole[] = ["STUDENT"];
export const OFFICE_TEST_ROLES: TestRole[] = ["SUPER_ADMIN", "OFFICE_STAFF", "CONTENT_MANAGER", "FACULTY"];

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
