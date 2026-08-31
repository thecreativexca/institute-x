import type { AssignmentStatSummary } from "./types";
import { normalizedPercentage } from "./percentages";

/**
 * Pure assignment performance calculations (spec §16/§17).
 *
 * Consumes plain, published-only assignment rows plus the student's submission
 * rows and derives every count. `isLate` is always derived from `submittedAt`
 * vs `dueAt` — never stored (spec §47).
 *
 * Assignment statuses are derived from the Submission model (Phase 11):
 *   - pending    → no submission yet
 *   - submitted  → submission exists, not yet graded
 *   - graded     → submission exists with a score
 *   - late       → any submission whose submittedAt > dueAt
 *
 * This module is dependency-free so it can be unit-tested with node.
 */

export interface AssignmentRow {
  _id: string;
  title: string;
  maxScore: number;
  dueAt: string | null;
}

export interface SubmissionRow {
  assignmentId: string;
  status: string;
  score?: number | null;
  totalMarks?: number | null;
  submittedAt: string | null;
  gradedAt?: string | null;
}

const GRADED = "graded";

/**
 * Derives the assignment performance summary for one course.
 *
 * Average uses normalized marks (Σ awarded / Σ possible × 100) across GRADED
 * submissions only, so assignments with different maximum marks are compared
 * fairly (spec §17). Returns `averagePercent: null` when there are no graded
 * submissions — the UI must say "not graded yet", never a fabricated 0%.
 */
export function computeAssignmentSummary(input: {
  assignments: AssignmentRow[];
  submissionsByAssignmentId: ReadonlyMap<string, SubmissionRow>;
}): AssignmentStatSummary {
  const { assignments, submissionsByAssignmentId } = input;

  let submitted = 0;
  let graded = 0;
  let late = 0;
  let awarded = 0;
  let possible = 0;
  let hasPossibleMarks = false;

  for (const assignment of assignments) {
    const sub = submissionsByAssignmentId.get(assignment._id);
    if (!sub) continue; // pending — no submission

    submitted += 1;

    const submittedAt = sub.submittedAt ? Date.parse(sub.submittedAt) : null;
    const dueAt =
      assignment.dueAt != null ? Date.parse(assignment.dueAt) : null;
    if (
      submittedAt !== null &&
      Number.isFinite(submittedAt) &&
      dueAt !== null &&
      Number.isFinite(dueAt) &&
      submittedAt > dueAt
    ) {
      late += 1;
    }

    if (sub.status === GRADED && typeof sub.score === "number") {
      graded += 1;
      const subTotal =
        typeof sub.totalMarks === "number" && sub.totalMarks > 0
          ? sub.totalMarks
          : assignment.maxScore;
      awarded += sub.score;
      possible += subTotal;
      hasPossibleMarks = true;
    }
  }

  const pending = assignments.length - submitted;

  return {
    totalAssignments: assignments.length,
    submitted,
    pending,
    graded,
    late,
    averagePercent: hasPossibleMarks
      ? Math.round(normalizedPercentage(awarded, possible) ?? 0)
      : null,
    hasAssignments: assignments.length > 0,
  };
}