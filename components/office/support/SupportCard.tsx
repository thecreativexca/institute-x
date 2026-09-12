"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfficeTicketSummary } from "@/lib/support";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, AlertCircle, Clock, CheckCircle, User, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
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
  open: { label: "Open", variant: "default" as const, icon: MessageSquare },
  in_progress: { label: "In Progress", variant: "primary" as const, icon: Clock },
  waiting_for_student: { label: "Waiting for Student", variant: "warning" as const, icon: AlertCircle },
  resolved: { label: "Resolved", variant: "success" as const, icon: CheckCircle },
  closed: { label: "Closed", variant: "neutral" as const, icon: CheckCircle },
} as const;

const priorityConfig = {
  low: { label: "Low", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  high: { label: "High", variant: "destructive" as const },
  urgent: { label: "Urgent", variant: "destructive" as const },
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all hover:border-primary-200 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/office/support/${ticket.id}`}
            className="font-medium text-slate-900 hover:text-primary-600 flex items-center gap-2"
          >
            <span className="text-sm text-primary-600">{ticket.ticketNumber}</span>
            <span className="truncate">{ticket.subject}</span>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <Link
              href={`/office/students/${ticket.studentId}`}
              className="text-slate-600 hover:text-primary-600 flex items-center gap-1"
            >
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              {ticket.studentName}
            </Link>
            <Badge variant="secondary">{categoryLabel}</Badge>
            <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
            <Badge variant={statusCfg.variant} className="gap-1">
              <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
              {statusCfg.label}
            </Badge>
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Assigned: {ticket.assignedToName || "Unassigned"} • Last activity: {format(new Date(ticket.lastMessageAt), "MMM d, yyyy HH:mm")}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/office/support/${ticket.id}`}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View
          </Link>
          {(canReply || canAssign || canManage) && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                  role="menu"
                >
                  <Link
                    role="menuitem"
                    href={`/office/support/${ticket.id}`}
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    View Details
                  </Link>
                  {canReply && (
                    <>
                      <hr className="my-1 border-slate-200" />
                      <button
                        role="menuitem"
                        onClick={() => goToSection("reply")}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <MessageSquare className="h-4 w-4" aria-hidden="true" />
                        Reply
                      </button>
                    </>
                  )}
                  {canAssign && (
                    <>
                      <hr className="my-1 border-slate-200" />
                      <button
                        role="menuitem"
                        onClick={() => goToSection("assign")}
                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Assign
                      </button>
                    </>
                  )}
                  {canManage && (
                    <>
                      <hr className="my-1 border-slate-200" />
                      {ticket.status !== "resolved" && ticket.status !== "closed" && (
                        <button
                          role="menuitem"
                          onClick={() => updateStatus("resolve")}
                          className="w-full px-4 py-2 text-left text-sm text-amber-700 hover:bg-amber-50 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          Resolve
                        </button>
                      )}
                      {ticket.status === "resolved" && (
                        <button
                          role="menuitem"
                          onClick={() => updateStatus("close")}
                          className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden="true" />
                          Close
                        </button>
                      )}
                      {(ticket.status === "resolved" || ticket.status === "closed") && (
                        <button
                          role="menuitem"
                          onClick={() => updateStatus("reopen")}
                          className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4 rotate-180" aria-hidden="true" />
                          Reopen
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {actionError ? (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      ) : null}
    </div>
  );
}
