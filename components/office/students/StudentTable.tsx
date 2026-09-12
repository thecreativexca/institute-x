"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";

import { OfficeStudentSummary } from "@/lib/office/students";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { MoreVertical, Mail, Phone, GraduationCap, CheckCircle, XCircle, AlertCircle, ExternalLink, Edit2 } from "lucide-react";
import { ConfirmDialog } from "./StudentProfileUI";

interface StudentTableProps {
  students: OfficeStudentSummary[];
  canUpdate: boolean;
  canManageStatus: boolean;
}

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "neutral" as const, icon: AlertCircle },
  suspended: { label: "Suspended", variant: "danger" as const, icon: XCircle },
} as const;

const emailVerifiedConfig = {
  verified: { label: "Verified", variant: "success" as const },
  unverified: { label: "Unverified", variant: "neutral" as const },
} as const;

const statusOptions = [
  { value: "active", label: "Active", variant: "success" as const },
  { value: "inactive", label: "Inactive", variant: "neutral" as const },
  { value: "suspended", label: "Suspended", variant: "danger" as const },
] as const;

export function StudentTable({
  students,
  canUpdate,
  canManageStatus,
}: StudentTableProps) {
  const router = useRouter();
  const [actionMenu, setActionMenu] = useState<{ studentId: string; x: number; y: number } | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ student: OfficeStudentSummary | null; open: boolean; status: "active" | "inactive" | "suspended" }>({ student: null, open: false, status: "active" });
  const [submitting, setSubmitting] = useState(false);

  const handleStatusChange = (student: OfficeStudentSummary, status: "active" | "inactive" | "suspended") => {
    setStatusDialog({ student, open: true, status });
  };

  const confirmStatusChange = async () => {
    if (!statusDialog.student || submitting) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      body.set("action", "status");
      body.set("status", statusDialog.status);
      const res = await fetch(`/api/office/students/${statusDialog.student.id}`, { method: "POST", body });
      if (res.ok) {
        router.refresh();
      } else {
        console.error("Failed to update student status");
      }
    } finally {
      setSubmitting(false);
      setStatusDialog({ student: null, open: false, status: "active" });
      setActionMenu(null);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrollments</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {students.map((student) => {
              const statusCfg = statusConfig[student.status];
              const verified = student.emailVerifiedAt ? "verified" : "unverified";
              const verifiedCfg = emailVerifiedConfig[verified];

              return (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/students/${student.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {student.name}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">{student.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    {student.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {!student.phone && <span className="text-sm text-slate-400">No phone</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <Badge variant={statusCfg.variant} className="gap-1">
                        <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                        {statusCfg.label}
                      </Badge>
                      <Badge variant={verifiedCfg.variant} className="gap-1">
                        {verifiedCfg.label}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-900">
                      {student.enrollmentCounts.total} total
                    </div>
                    <div className="flex gap-2 mt-1 text-xs">
                      {student.enrollmentCounts.active > 0 && (
                        <Badge variant="success" className="gap-1">
                          <GraduationCap className="h-2.5 w-2.5" aria-hidden="true" />
                          {student.enrollmentCounts.active} active
                        </Badge>
                      )}
                      {student.enrollmentCounts.completed > 0 && (
                        <Badge variant="primary" className="gap-1">
                          <CheckCircle className="h-2.5 w-2.5" aria-hidden="true" />
                          {student.enrollmentCounts.completed} completed
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {student.enrollmentCounts.total > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-primary-600" style={{ width: "0%" }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">No enrollments</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(student.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/students/${student.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        View
                        <ExternalLink className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
                      </Link>
                      {(canUpdate || canManageStatus) && (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ studentId: student.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.studentId === student.id && (
                            <div
                              className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/students/${student.id}/edit`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" aria-hidden="true" />
                                Edit Profile
                              </Link>
                              {canManageStatus && (
                                <>
                                  <hr className="my-1 border-slate-200" />
                                  {student.status !== "suspended" && (
                                    <button
                                      role="menuitem"
                                      onClick={() => handleStatusChange(student, "suspended")}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                      <XCircle className="h-4 w-4" aria-hidden="true" />
                                      Suspend Account
                                    </button>
                                  )}
                                  {student.status === "suspended" && (
                                    <button
                                      role="menuitem"
                                      onClick={() => handleStatusChange(student, "active")}
                                      className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                      Activate Account
                                    </button>
                                  )}
                                  {student.status !== "inactive" && (
                                    <button
                                      role="menuitem"
                                      onClick={() => handleStatusChange(student, "inactive")}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                                      Mark Inactive
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {actionMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActionMenu(null)}
          aria-hidden="true"
        />
      )}

      {statusDialog.open && statusDialog.student && (
        <ConfirmDialog
          isOpen={statusDialog.open}
          onClose={() => setStatusDialog({ student: null, open: false, status: "active" })}
          onConfirm={confirmStatusChange}
          title={
            statusDialog.status === "active"
              ? "Activate Student Account"
              : statusDialog.status === "suspended"
                ? "Suspend Student Account"
                : "Mark Student Inactive"
          }
          description={
            statusDialog.status === "suspended"
              ? `This will suspend ${statusDialog.student.name}'s account. They will lose access to the portal immediately. Their learning history, enrollments, and payments will be preserved.`
              : `This will update ${statusDialog.student.name}'s account status to ${statusDialog.status}. Their learning history, enrollments, and payments will be preserved.`
          }
          confirmLabel={
            statusDialog.status === "suspended"
              ? "Suspend Account"
              : statusDialog.status === "active"
                ? "Activate Account"
                : "Mark Inactive"
          }
                    variant={statusDialog.status === "suspended" ? "danger" : "default"}
        />
      )}
    </>
  );
}
