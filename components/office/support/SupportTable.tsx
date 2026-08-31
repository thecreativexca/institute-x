"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfficeTicketSummary } from "@/lib/support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, ExternalLink, AlertCircle, Clock, CheckCircle, User, ArrowRight, MessageSquare } from "lucide-react";
import { useState } from "react";
import { runOfficeTicketAction, type OfficeTicketAction } from "@/lib/support/client";

interface SupportTableProps {
  tickets: OfficeTicketSummary[];
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

export function SupportTable({
  tickets,
  canManage,
  canReply,
  canAssign,
}: SupportTableProps) {
  const router = useRouter();
  const [actionMenu, setActionMenu] = useState<{ ticketId: string; x: number; y: number } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const goToSection = (ticketId: string, section: "reply" | "assign") => {
    setActionMenu(null);
    router.push(`/office/support/${ticketId}#${section}`);
  };

  const updateStatus = async (ticketId: string, action: OfficeTicketAction) => {
    setActionMenu(null);
    setActionError(null);
    const result = await runOfficeTicketAction(ticketId, action);
    if (!result.success) {
      setActionError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <>
      {actionError ? (
        <p role="alert" className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {actionError}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Activity</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tickets.map((ticket) => {
              const statusCfg = statusConfig[ticket.status];
              const priorityCfg = priorityConfig[ticket.priority];
              const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

              return (
                <tr key={ticket.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/support/${ticket.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600"
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <div>
                        <Link
                          href={`/office/students/${ticket.studentId}`}
                          className="font-medium text-slate-900 hover:text-primary-600"
                        >
                          {ticket.studentName}
                        </Link>
                        <p className="text-xs text-slate-500 truncate max-w-xs">{ticket.studentEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/office/support/${ticket.id}`}
                      className="font-medium text-slate-900 hover:text-primary-600 max-w-xs truncate block"
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant="secondary">{categoryLabel}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusCfg.variant} className="gap-1">
                      <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                      {statusCfg.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {ticket.assignedToName ? (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                        {ticket.assignedToName}
                      </div>
                    ) : (
                      <Badge variant="neutral">Unassigned</Badge>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {format(new Date(ticket.lastMessageAt), "MMM d, yyyy HH:mm")}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/office/support/${ticket.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 hidden sm:inline-flex items-center gap-1"
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
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ ticketId: ticket.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.ticketId === ticket.id && (
                            <div
                              className="absolute right-0 mt-1 w-56 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/support/${ticket.id}`}
                                onClick={() => setActionMenu(null)}
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
                                    onClick={() => goToSection(ticket.id, "reply")}
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
                                    onClick={() => goToSection(ticket.id, "assign")}
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
                                      onClick={() => updateStatus(ticket.id, "resolve")}
                                      className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                      Resolve
                                    </button>
                                  )}
                                  {ticket.status === "resolved" && (
                                    <button
                                      role="menuitem"
                                      onClick={() => updateStatus(ticket.id, "close")}
                                      className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                      Close
                                    </button>
                                  )}
                                  {(ticket.status === "resolved" || ticket.status === "closed") && (
                                    <button
                                      role="menuitem"
                                      onClick={() => updateStatus(ticket.id, "reopen")}
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
    </>
  );
}
