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

export function canReadStudents(role: string): boolean {
  return role === "super_admin" || role === "office_staff";
}

export function canUpdateStudents(role: string): boolean {
  return role === "super_admin" || role === "office_staff";
}

export function canManageStudentStatus(role: string): boolean {
  return role === "super_admin" || role === "office_staff";
}

export function canManageEnrollments(role: string): boolean {
  return role === "super_admin" || role === "office_staff";
}

export function canReadPayments(role: string): boolean {
  return role === "super_admin" || role === "office_staff";
}

export function canReadCertificates(role: string): boolean {
  return role === "super_admin" || role === "office_staff" || role === "faculty";
}

export function canReadAssignments(role: string): boolean {
  return role === "super_admin" || role === "office_staff" || role === "faculty";
}

export function canReadQuizResults(role: string): boolean {
  return role === "super_admin" || role === "office_staff" || role === "faculty";
}

export function checkPermission(role: string, permission: Permission): boolean {
  return hasPermission(role, permission);
}