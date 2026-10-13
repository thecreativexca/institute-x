"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { OfficeTicketSummary } from "@/lib/support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical, ExternalLink, AlertCircle, Clock, CheckCircle,
  User, ArrowRight, MessageSquare, Ticket,
} from "lucide-react";
import { useState } from "react";
import { runOfficeTicketAction, type OfficeTicketAction } from "@/lib/support/client";

interface SupportTableProps {
  tickets: OfficeTicketSummary[];
  canManage: boolean;
  canReply: boolean;
  canAssign: boolean;
}

const statusConfig = {
  open: { label: "Open", variant: "default" as const, icon: MessageSquare, pill: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
  in_progress: { label: "In Progress", variant: "primary" as const, icon: Clock, pill: "bg-violet-50 text-violet-700 ring-1 ring-violet-200" },
  waiting_for_student: { label: "Waiting", variant: "warning" as const, icon: AlertCircle, pill: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  resolved: { label: "Resolved", variant: "success" as const, icon: CheckCircle, pill: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  closed: { label: "Closed", variant: "neutral" as const, icon: CheckCircle, pill: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" },
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

export function SupportTable({ tickets, canManage, canReply, canAssign }: SupportTableProps) {
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
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full min-w-[900px] table-fixed" role="table">
          <colgroup>
            <col className="w-[120px]" />  {/* Ticket */}
            <col className="w-[180px]" />  {/* Student */}
            <col className="w-[160px]" />  {/* Subject */}
            <col className="w-[110px]" />  {/* Category */}
            <col className="w-[90px]" />   {/* Priority */}
            <col className="w-[120px]" />  {/* Status */}
            <col className="w-[130px]" />  {/* Assigned */}
            <col className="w-[110px]" />  {/* Last Activity */}
            <col className="w-[100px]" />  {/* Actions */}
          </colgroup>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Ticket</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Student</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Subject</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Category</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Priority</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Assigned</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">Last Activity</th>
              <th className="px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-widest text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const statusCfg = statusConfig[ticket.status];
              const priorityCfg = priorityConfig[ticket.priority];
              const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

              return (
                <tr
                  key={ticket.id}
                  className="group transition-colors duration-150 hover:bg-slate-50/70"
                >
                  {/* Ticket number */}
                  <td className="px-3 py-3.5 align-middle">
                    <Link
                      href={`/office/support/${ticket.id}`}
                      className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline truncate"
                    >
                      <Ticket className="h-3 w-3 shrink-0 text-primary-400" aria-hidden="true" />
                      <span className="truncate">{ticket.ticketNumber}</span>
                    </Link>
                  </td>

                  {/* Student */}
                  <td className="px-3 py-3.5 align-middle">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                        {ticket.studentName?.charAt(0) ?? "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/office/students/${ticket.studentId}`}
                          className="block truncate text-xs font-semibold text-slate-800 hover:text-primary-600"
                        >
                          {ticket.studentName}
                        </Link>
                        <p className="truncate text-[10px] text-slate-400">{ticket.studentEmail}</p>
                      </div>
                    </div>
                  </td>

                  {/* Subject */}
                  <td className="px-3 py-3.5 align-middle">
                    <Link
                      href={`/office/support/${ticket.id}`}
                      className="block truncate text-xs font-medium text-slate-700 hover:text-primary-600"
                    >
                      {ticket.subject}
                    </Link>
                  </td>

                  {/* Category */}
                  <td className="px-3 py-3.5 align-middle">
                    <span className="inline-flex items-center truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {categoryLabel}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="px-3 py-3.5 align-middle">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${priorityCfg.pill}`}>
                      {priorityCfg.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3.5 align-middle">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusCfg.pill}`}>
                      <statusCfg.icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                      <span className="truncate">{statusCfg.label}</span>
                    </span>
                  </td>

                  {/* Assigned */}
                  <td className="px-3 py-3.5 align-middle">
                    {ticket.assignedToName ? (
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[9px] font-bold text-primary-700 uppercase">
                          {ticket.assignedToName.charAt(0)}
                        </span>
                        <span className="truncate text-xs text-slate-600">{ticket.assignedToName}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400">
                        <User className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Last Activity */}
                  <td className="px-3 py-3.5 align-middle">
                    <div className="text-xs text-slate-600 tabular-nums">
                      {format(new Date(ticket.lastMessageAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      {format(new Date(ticket.lastMessageAt), "HH:mm")}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3.5 align-middle text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/office/support/${ticket.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
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
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActionMenu({ ticketId: ticket.id, x: rect.left, y: rect.bottom });
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          {actionMenu?.ticketId === ticket.id && (
                            <div
                              className="absolute right-0 mt-1 w-56 rounded-xl border border-slate-200 bg-white shadow-xl py-1.5 z-10"
                              role="menu"
                            >
                              <Link
                                role="menuitem"
                                href={`/office/support/${ticket.id}`}
                                onClick={() => setActionMenu(null)}
                                className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                View Details
                              </Link>
                              {canReply && (
                                <>
                                  <hr className="my-1 border-slate-100" />
                                  <button
                                    role="menuitem"
                                    onClick={() => goToSection(ticket.id, "reply")}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <MessageSquare className="h-4 w-4 text-slate-400" aria-hidden="true" />
                                    Reply
                                  </button>
                                </>
                              )}
                              {canAssign && (
                                <>
                                  <hr className="my-1 border-slate-100" />
                                  <button
                                    role="menuitem"
                                    onClick={() => goToSection(ticket.id, "assign")}
                                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
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
                                      onClick={() => updateStatus(ticket.id, "resolve")}
                                      className="w-full px-4 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
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
