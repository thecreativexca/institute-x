import "server-only";

import { Types } from "mongoose";

import { connectDB } from "@/lib/db/connect";
import {
  CERTIFICATE_STATUSES,
  ENROLLMENT_STATUSES,
  USER_ROLES,
  type CertificateStatus,
} from "@/lib/constants";
import { Certificate } from "@/models/Certificate";
import { Course } from "@/models/Course";
import { Enrollment } from "@/models/Enrollment";
import { User } from "@/models/User";

import type {
  CertificateEligibleEnrollmentOption,
  CertificateOption,
  OfficeCertificateListResult,
  OfficeCertificateRow,
  OfficeCertificateStats,
} from "./dto";
import type { CertificateFiltersInput } from "./validation";

/**
 * Admin-scoped certificate reads.
 *
 * Every query here is only ever called from an ADMIN-guarded page or route
 * handler (see `requireAdmin` / `requireAdminApi`). Unlike the student queries
 * these intentionally span all students.
 *
 * Because admin-uploaded certificates may have no `course` document, the
 * course label always comes from the `courseNameSnapshot` written at creation
 * — never from a populate that could come back null.
 */

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id);
}

/** Raw shape returned by `.lean()`, narrowed to the fields we map. */
interface RawCertificate {
  _id: Types.ObjectId;
  certificateNumber: string;
  verificationCode: string;
  certificateTitle?: string | null;
  student: Types.ObjectId;
  studentNameSnapshot: string;
  course?: Types.ObjectId | null;
  courseNameSnapshot: string;
  issuedAt: Date;
  completionDate?: Date | null;
  grade?: string | null;
  notes?: string | null;
  status: string;
  certificateType: string;
  fileType?: string | null;
  fileSize?: number | null;
  originalFileName?: string | null;
  revokedAt?: Date | null;
  revocationReason?: string | null;
  replacedAt?: Date | null;
  restoredAt?: Date | null;
  uploadedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

function toRow(raw: RawCertificate): OfficeCertificateRow {
  return {
    id: raw._id.toString(),
    certificateNumber: raw.certificateNumber,
    verificationCode: raw.verificationCode,
    certificateTitle: raw.certificateTitle ?? null,
    studentId: raw.student?.toString() ?? "",
    studentName: raw.studentNameSnapshot,
    courseId: raw.course?.toString() ?? null,
    courseName: raw.courseNameSnapshot,
    issueDate: raw.issuedAt.toISOString(),
    completionDate: raw.completionDate?.toISOString() ?? null,
    grade: raw.grade ?? null,
    notes: raw.notes ?? null,
    status: raw.status as OfficeCertificateRow["status"],
    certificateType: raw.certificateType as OfficeCertificateRow["certificateType"],
    fileType: raw.fileType ?? "application/pdf",
    fileSize: raw.fileSize ?? null,
    originalFileName: raw.originalFileName ?? null,
    revokedAt: raw.revokedAt?.toISOString() ?? null,
    revocationReason: raw.revocationReason ?? null,
    replacedAt: raw.replacedAt?.toISOString() ?? null,
    restoredAt: raw.restoredAt?.toISOString() ?? null,
    uploadedBy: raw.uploadedBy?.toString() ?? null,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
  };
}

/**
 * Builds the Mongo filter for the admin list.
 *
 * Free-text search spans student name (snapshot), student id and certificate
 * number. The student-id branch is only added when the term is a valid
 * ObjectId, so a partial name never triggers a CastError.
 */
export function buildCertificateFilter(filters: CertificateFiltersInput) {
  const query: Record<string, unknown> = {};

  if (filters.status && filters.status !== "ALL") {
    query.status = filters.status;
  }

  if (filters.studentId) {
    query.student = toObjectId(filters.studentId);
  }

  if (filters.courseId) {
    query.course = toObjectId(filters.courseId);
  }

  if (filters.number) {
    query.certificateNumber = filters.number.trim().toUpperCase();
  }

  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q.trim()), "i");
    const searchTerms: Record<string, unknown>[] = [
      { studentNameSnapshot: regex },
      { certificateNumber: regex },
      { courseNameSnapshot: regex },
      { certificateTitle: regex },
    ];
    // Only treat the term as an id lookup when it could actually be one.
    if (Types.ObjectId.isValid(filters.q.trim())) {
      searchTerms.push({ student: toObjectId(filters.q.trim()) });
    }
    query.$or = searchTerms;
  }

  if (filters.issuedFrom || filters.issuedTo) {
    const range: Record<string, Date> = {};
    if (filters.issuedFrom) {
      const from = new Date(filters.issuedFrom);
      if (!Number.isNaN(from.getTime())) range.$gte = from;
    }
    if (filters.issuedTo) {
      const to = new Date(filters.issuedTo);
      if (!Number.isNaN(to.getTime())) {
        // Inclusive end-of-day so "to = today" includes today's certificates.
        to.setHours(23, 59, 59, 999);
        range.$lte = to;
      }
    }
    if (Object.keys(range).length > 0) query.issuedAt = range;
  }

  return query;
}

/** Paginated admin certificate list, newest first by default. */
export async function listOfficeCertificates(
  filters: CertificateFiltersInput
): Promise<OfficeCertificateListResult> {
  await connectDB();

  const { page, limit } = filters;
  const skip = (page - 1) * limit;
  const query = buildCertificateFilter(filters);

  const sortField =
    filters.sort === "studentName" ? "studentNameSnapshot" : filters.sort;
  const sort: Record<string, 1 | -1> = {
    [sortField]: filters.direction === "asc" ? 1 : -1,
  };

  const [rows, total] = await Promise.all([
    Certificate.find(query)
      // `notes` is select:false on the schema; +notes opts it in for admins only.
      .select("+notes")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Certificate.countDocuments(query),
  ]);

  return {
    certificates: (rows as unknown as RawCertificate[]).map(toRow),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/** A single certificate for the admin detail view, or null. */
export async function getOfficeCertificate(
  certificateId: string
): Promise<OfficeCertificateRow | null> {
  if (!Types.ObjectId.isValid(certificateId)) return null;

  await connectDB();
  const raw = await Certificate.findById(certificateId)
    .select("+notes")
    .lean();

  if (!raw) return null;
  return toRow(raw as unknown as RawCertificate);
}

/** Dashboard counters for the admin certificates module. */
export async function getOfficeCertificateStats(): Promise<OfficeCertificateStats> {
  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, active, revoked, issuedThisMonth] = await Promise.all([
    Certificate.countDocuments({}),
    Certificate.countDocuments({ status: CERTIFICATE_STATUSES.ISSUED }),
    Certificate.countDocuments({ status: CERTIFICATE_STATUSES.REVOKED }),
    Certificate.countDocuments({ issuedAt: { $gte: startOfMonth } }),
  ]);

  return { total, active, revoked, issuedThisMonth };
}

/**
 * Certificate numbers are unique; this pre-check produces a friendly error
 * before insert. The unique index remains the real guarantee (a race between
 * the check and the insert is still caught as a duplicate-key error).
 */
export async function certificateNumberExists(
  certificateNumber: string,
  excludeCertificateId?: string
): Promise<boolean> {
  await connectDB();
  const query: Record<string, unknown> = {
    certificateNumber: certificateNumber.trim().toUpperCase(),
  };
  if (excludeCertificateId && Types.ObjectId.isValid(excludeCertificateId)) {
    query._id = { $ne: toObjectId(excludeCertificateId) };
  }
  const found = await Certificate.findOne(query).select("_id").lean();
  return Boolean(found);
}

/* ------------------------------ Lookups / options ------------------------------ */

/** Searchable student list for the admin combobox. */
export async function searchStudentsForCertificates(
  term: string | undefined,
  limit: number
): Promise<CertificateOption[]> {
  await connectDB();

  const query: Record<string, unknown> = { role: USER_ROLES.STUDENT };
  if (term) {
    const regex = new RegExp(escapeRegex(term.trim()), "i");
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const students = await User.find(query)
    .select("name email")
    .sort({ name: 1 })
    .limit(limit)
    .lean();

  return students.map((student) => ({
    id: student._id.toString(),
    label: student.name,
    hint: student.email,
  }));
}

/** Convenience lookup used by the upload form after a student is picked. */
export async function getStudentOption(
  studentId: string
): Promise<CertificateOption | null> {
  if (!Types.ObjectId.isValid(studentId)) return null;
  await connectDB();
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLES.STUDENT,
  })
    .select("name email")
    .lean();
  if (!student) return null;
  return {
    id: student._id.toString(),
    label: student.name,
    hint: student.email,
  };
}

/** Published courses, for the manual course selector. */
export async function listCourseOptions(): Promise<CertificateOption[]> {
  await connectDB();
  const courses = await Course.find({ status: "published" })
    .select("name slug")
    .sort({ name: 1 })
    .lean();
  return courses.map((course) => ({
    id: course._id.toString(),
    label: course.name,
    hint: course.slug,
  }));
}

/** Courses the given student is actually enrolled in. */
export async function listStudentCourseOptions(
  studentId: string
): Promise<CertificateOption[]> {
  if (!Types.ObjectId.isValid(studentId)) return [];

  await connectDB();

  const enrollments = await Enrollment.find({ student: studentId })
    .select("course status")
    .lean();
  if (enrollments.length === 0) return [];

  const courses = await Course.find({
    _id: { $in: enrollments.map((e) => e.course) },
  })
    .select("name slug")
    .lean();

  const nameById = new Map(
    courses.map((course) => [course._id.toString(), course])
  );

  return enrollments.flatMap((enrollment) => {
    const course = nameById.get(enrollment.course.toString());
    if (!course) return [];
    return [
      {
        id: course._id.toString(),
        label: course.name,
        hint: enrollment.status,
      },
    ];
  });
}

/**
 * Completed enrollments for a student that can still be turned into a
 * server-generated certificate (admin-triggered "issue" flow).
 *
 * Admin-uploaded certificates are independent of enrollments, so this is an
 * optional convenience path on the upload page rather than a requirement.
 */
export async function listIssuableEnrollments(
  studentId: string
): Promise<CertificateEligibleEnrollmentOption[]> {
  if (!Types.ObjectId.isValid(studentId)) return [];

  await connectDB();

  const enrollments = await Enrollment.find({
    student: toObjectId(studentId),
    status: ENROLLMENT_STATUSES.COMPLETED,
  })
    .select("_id course completedAt")
    .lean();

  if (enrollments.length === 0) return [];

  const enrollmentIds = enrollments.map((e) => e._id);
  const [courses, existing] = await Promise.all([
    Course.find({ _id: { $in: enrollments.map((e) => e.course) } })
      .select("name")
      .lean(),
    Certificate.find({ enrollment: { $in: enrollmentIds } })
      .select("enrollment")
      .lean(),
  ]);

  const courseNameById = new Map(
    courses.map((course) => [course._id.toString(), course.name])
  );
  const issuedEnrollmentIds = new Set(
    existing.flatMap((c) => (c.enrollment ? [c.enrollment.toString()] : []))
  );

  return enrollments.flatMap((enrollment) => {
    const courseName = courseNameById.get(enrollment.course.toString());
    if (!courseName) return [];
    return [
      {
        enrollmentId: enrollment._id.toString(),
        courseId: enrollment.course.toString(),
        courseName,
        completionDate:
          enrollment.completedAt?.toISOString() ?? new Date().toISOString(),
        alreadyIssued: issuedEnrollmentIds.has(enrollment._id.toString()),
      },
    ];
  });
}

/** Validates that a student id resolves to a real student (used before insert). */
export async function assertStudentExists(studentId: string): Promise<string> {
  await connectDB();
  const student = await User.findOne({
    _id: studentId,
    role: USER_ROLES.STUDENT,
  })
    .select("name")
    .lean();
  if (!student) return "";
  return student.name;
}

/** Storage reference for the admin viewer/download proxy. */
export interface CertificateFileRef {
  pdfUrl: string;
  fileType: string | null;
  certificateNumber: string;
  status: CertificateStatus;
}

/**
 * Minimal read used by the file-proxy routes. Deliberately separate from
 * `getOfficeCertificate` so the delivery URL is only ever loaded by the two
 * routes whose whole job is to stream a file — it never travels in a list
 * payload or a page prop.
 */
export async function getCertificateFileRef(
  certificateId: string
): Promise<CertificateFileRef | null> {
  if (!Types.ObjectId.isValid(certificateId)) return null;

  await connectDB();
  const raw = await Certificate.findById(certificateId)
    .select("pdfUrl fileType certificateNumber status")
    .lean();

  if (!raw) return null;
  return {
    pdfUrl: raw.pdfUrl,
    fileType: raw.fileType ?? "application/pdf",
    certificateNumber: raw.certificateNumber,
    status: raw.status as CertificateStatus,
  };
}
