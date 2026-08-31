"use client";

import { format } from "date-fns";
import Link from "next/link";

import { OfficeStudentSummary } from "@/lib/office/students";
import { Badge } from "@/components/ui/badge";
import { Phone, GraduationCap, CheckCircle, XCircle, AlertCircle, ExternalLink, ChevronRight } from "lucide-react";

const statusConfig = {
  active: { label: "Active", variant: "success" as const, icon: CheckCircle },
  inactive: { label: "Inactive", variant: "neutral" as const, icon: AlertCircle },
  suspended: { label: "Suspended", variant: "danger" as const, icon: XCircle },
} as const;

const emailVerifiedConfig = {
  verified: { label: "Verified", variant: "success" as const },
  unverified: { label: "Unverified", variant: "neutral" as const },
} as const;

interface StudentCardProps {
  student: OfficeStudentSummary;
}

export function StudentCard({ student }: StudentCardProps) {
  const statusCfg = statusConfig[student.status];
  const verified = student.emailVerifiedAt ? "verified" : "unverified";
  const verifiedCfg = emailVerifiedConfig[verified];

  return (
    <Link
      href={`/office/students/${student.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
            {student.name}
          </h3>
          <p className="mt-1 text-sm text-slate-500 truncate">{student.email}</p>

          {student.phone && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Phone className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>{student.phone}</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
            <Badge variant={verifiedCfg.variant} className="gap-1">
              {verifiedCfg.label}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" aria-hidden="true" />
              {student.enrollmentCounts.total} courses
              {student.enrollmentCounts.active > 0 && (
                <span className="ml-1 text-primary-600">({student.enrollmentCounts.active} active)</span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
              Joined {format(new Date(student.createdAt), "MMM d, yyyy")}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <ExternalLink className="h-5 w-5 text-slate-400 group-hover:text-primary-600 transition-colors" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
