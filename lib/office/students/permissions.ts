import { PERMISSIONS, type Permission } from "@/lib/constants";
import { hasPermission } from "@/lib/auth/permissions";

export const STUDENT_PERMISSIONS = {
  READ: PERMISSIONS.STUDENTS_READ,
  UPDATE: PERMISSIONS.STUDENTS_UPDATE,
  STATUS: PERMISSIONS.STUDENTS_STATUS,
  ENROLLMENTS_READ: PERMISSIONS.ENROLLMENTS_READ,
  ENROLLMENTS_MANAGE: PERMISSIONS.ENROLLMENTS_MANAGE,
  PAYMENTS_READ: PERMISSIONS.PAYMENTS_READ,
  CERTIFICATES_READ: PERMISSIONS.CERTIFICATES_READ,
  REPORTS_READ: PERMISSIONS.REPORTS_READ,
  ASSIGNMENTS_READ: PERMISSIONS.ASSIGNMENTS_READ,
  QUIZ_RESULTS_READ: PERMISSIONS.QUIZ_RESULTS_READ,
} as const;

// Two-role system: every office/student-management capability belongs to ADMIN.
export function canReadStudents(role: string): boolean {
  return role === "admin";
}

export function canUpdateStudents(role: string): boolean {
  return role === "admin";
}

export function canManageStudentStatus(role: string): boolean {
  return role === "admin";
}

export function canManageEnrollments(role: string): boolean {
  return role === "admin";
}

export function canReadPayments(role: string): boolean {
  return role === "admin";
}

export function canReadCertificates(role: string): boolean {
  return role === "admin";
}

export function canReadAssignments(role: string): boolean {
  return role === "admin";
}

export function canReadQuizResults(role: string): boolean {
  return role === "admin";
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}