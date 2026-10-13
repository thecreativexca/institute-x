"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfficeTicketSummary } from "@/lib/support";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical, AlertCircle, Clock, CheckCircle, User,
  MessageSquare, ArrowRight, ExternalLink, Ticket,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { runOfficeTicketAction, type OfficeTicketAction } from "@/lib/support/client";

interface SupportCardProps {
  ticket: OfficeTicketSummary;
  canManage: boolean;
  canReply: boolean;
  canAssign: boolean;
}

const statusConfig = {
  open: { label: "Open", icon: MessageSquare, pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  in_progress: { label: "In Progress", icon: Clock, pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200" },
  waiting_for_student: { label: "Waiting", icon: AlertCircle, pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  resolved: { label: "Resolved", icon: CheckCircle, pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  closed: { label: "Closed", icon: CheckCircle, pill: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
} as const;

const priorityConfig = {
  low: { label: "Low", pill: "bg-slate-100 text-slate-500" },
  normal: { label: "Normal", pill: "bg-sky-50 text-sky-600 ring-1 ring-sky-200" },
  high: { label: "High", pill: "bg-orange-50 text-orange-700 ring-1 ring-orange-200" },
  urgent: { label: "Urgent", pill: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
} as const;

const categoryLabels: Record<string, string> = {
  course_access: "Course Access",
  payment: "Payment",
  technical: "Technical",
  assignment: "Assignment",
  quiz: "Quiz",
  certificate: "Certificate",
  account: "Account",
  other: "Other",
};

export function SupportCard({ ticket, canManage, canReply, canAssign }: SupportCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const statusCfg = statusConfig[ticket.status];
  const priorityCfg = priorityConfig[ticket.priority];
  const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

  const goToSection = (section: "reply" | "assign") => {
    setMenuOpen(false);
    router.push(`/office/support/${ticket.id}#${section}`);
  };

  const updateStatus = async (action: OfficeTicketAction) => {
    setMenuOpen(false);
    setActionError(null);
    const result = await runOfficeTicketAction(ticket.id, action);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Ticket number + subject */}
          <Link
            href={`/office/support/${ticket.id}`}
            className="flex items-start gap-2 group/link"
          >
            <Ticket className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-400" aria-hidden="true" />
            <div className="min-w-0">
              <span className="font-mono text-xs font-semibold text-primary-600">
                {ticket.ticketNumber}
              </span>
              <p className="mt-0.5 truncate text-sm font-semibold text-slate-800 group-hover/link:text-primary-700 transition-colors">
                {ticket.subject}
              </p>
            </div>
          </Link>

          {/* Badges row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusCfg.pill}`}>
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${priorityCfg.pill}`}>
              {priorityCfg.label}
            </span>
            <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/office/support/${ticket.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View
          </Link>
          {(canReply || canAssign || canManage) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div
                    className="absolute right-0 mt-1 w-52 rounded-xl border border-slate-200 bg-white shadow-xl py-1.5 z-50"
                    role="menu"
                  >
                    <Link
                      role="menuitem"
                      href={`/office/support/${ticket.id}`}
                      onClick={() => setMenuOpen(false)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                      View Details
                    </Link>
                    {canReply && (
                      <>
                        <hr className="my-1 border-slate-100" />
                        <button
                          role="menuitem"
                          onClick={() => goToSection("reply")}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <MessageSquare className="h-4 w-4 text-slate-400" />
                          Reply
                        </button>
                      </>
                    )}
                    {canAssign && (
                      <>
                        <hr className="my-1 border-slate-100" />
                        <button
                          role="menuitem"
                          onClick={() => goToSection("assign")}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Assign
                        </button>
                      </>
                    )}
                    {canManage && (
                      <>
                        <hr className="my-1 border-slate-100" />
                        {ticket.status !== "resolved" && ticket.status !== "closed" && (
                          <button
                            role="menuitem"
                            onClick={() => updateStatus("resolve")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Resolve
                          </button>
                        )}
                        {ticket.status === "resolved" && (
                          <button
                            role="menuitem"
                            onClick={() => updateStatus("close")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Close
                          </button>
                        )}
                        {(ticket.status === "resolved" || ticket.status === "closed") && (
                          <button
                            role="menuitem"
                            onClick={() => updateStatus("reopen")}
                            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                          >
                            <ArrowRight className="h-4 w-4 rotate-180" />
                            Reopen
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <Link
          href={`/office/students/${ticket.studentId}`}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-primary-600 transition-colors"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
            {ticket.studentName?.charAt(0) ?? "?"}
          </span>
          <span className="font-medium">{ticket.studentName}</span>
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          {ticket.assignedToName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ticket.assignedToName}
            </span>
          )}
          <span>{format(new Date(ticket.lastMessageAt), "MMM d, HH:mm")}</span>
        </div>
      </div>

      {actionError && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {actionError}
        </p>
      )}
    </div>
  );
}
