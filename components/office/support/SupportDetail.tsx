"use client";

import { format } from "date-fns";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { OfficeTicketDetail, TicketMessage } from "@/lib/support";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, CheckCircle, Clock, MessageSquare, User, Mail, MoreVertical, Edit2, ChevronDown, ChevronUp, ArrowRight, Zap, Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SupportDetailProps {
  ticket: OfficeTicketDetail;
  canManage: boolean;
  canReply: boolean;
  canAssign: boolean;
  currentUserId: string;
  currentUserRole: string;
  currentUserName: string;
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

export function SupportDetail({
  ticket,
  canManage,
  canReply,
  canAssign,
  currentUserId,
  currentUserRole,
  currentUserName,
}: SupportDetailProps) {
  const router = useRouter();
  const [isReplying, setIsReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [priorityMenuOpen, setPriorityMenuOpen] = useState(false);

  const statusCfg = statusConfig[ticket.status];
  const priorityCfg = priorityConfig[ticket.priority];
  const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

  const validateReply = () => {
    const newErrors: Record<string, string> = {};
    if (!replyMessage.trim()) newErrors.message = "Message is required";
    setReplyErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReplySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateReply()) return;

    setIsReplying(true);
    try {
      const body = new FormData();
      body.set("action", "reply");
      body.set("message", replyMessage.trim());
      body.set("isInternal", isInternal.toString());

      const res = await fetch(`/api/office/support/${ticket.id}`, {
        method: "PATCH",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
        setReplyMessage("");
        setIsInternal(false);
        setShowReplyForm(false);
      } else {
        setReplyErrors({ form: data.error || "Failed to send reply" });
      }
    } catch (error) {
      setReplyErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsReplying(false);
    }
  };

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!assignUserId) {
      setAssignErrors({ assignedTo: "Please select a staff member" });
      return;
    }

    setIsAssigning(true);
    try {
      const body = new FormData();
      body.set("action", "update");
      body.set("assignedTo", assignUserId);

      const res = await fetch(`/api/office/support/${ticket.id}`, {
        method: "PATCH",
        body,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.refresh();
        setAssignUserId("");
        setShowAssignForm(false);
      } else {
        setAssignErrors({ form: data.error || "Failed to assign ticket" });
      }
    } catch (error) {
      setAssignErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    const body = new FormData();
    body.set("action", "update");
    body.set("status", newStatus);

    const res = await fetch(`/api/office/support/${ticket.id}`, {
      method: "PATCH",
      body,
    });

    if (res.ok) {
      router.refresh();
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    const body = new FormData();
    body.set("action", "update");
    body.set("priority", newPriority);

    const res = await fetch(`/api/office/support/${ticket.id}`, {
      method: "PATCH",
      body,
    });

    if (res.ok) {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-primary-600">{ticket.ticketNumber}</span>
              <Badge variant={statusCfg.variant} className="gap-1">
                <statusCfg.icon className="h-3 w-3" aria-hidden="true" />
                {statusCfg.label}
              </Badge>
              <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
            </div>
            <CardTitle>{ticket.subject}</CardTitle>
            <CardDescription>
              {ticket.studentName} • {categoryLabel}
              {ticket.courseName && ` • ${ticket.courseName}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {canManage && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  className="gap-1"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  Status
                </Button>
                {statusMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10">
                    {Object.entries(statusConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        role="menuitem"
                        onClick={() => handleStatusChange(key)}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2",
                          ticket.status === key ? "text-primary-600 font-medium" : "text-slate-700"
                        )}
                      >
                        <cfg.icon className="h-4 w-4" aria-hidden="true" />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {canManage && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPriorityMenuOpen(!priorityMenuOpen)}
                  className="gap-1"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  Priority
                </Button>
                {priorityMenuOpen && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md border border-slate-200 bg-white shadow-lg py-1 z-10">
                    {Object.entries(priorityConfig).map(([key, cfg]) => (
                      <button
                        key={key}
                        role="menuitem"
                        onClick={() => handlePriorityChange(key)}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2",
                          ticket.priority === key ? "text-primary-600 font-medium" : "text-slate-700"
                        )}
                      >
                        <span className={`h-2 w-2 rounded-full ${cfg.variant === "destructive" ? "bg-red-500" : cfg.variant === "secondary" ? "bg-gray-400" : "bg-slate-400"}`} />
                        {cfg.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Student</dt>
              <dd className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <span>{ticket.studentName}</span>
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Email</dt>
              <dd className="text-sm font-medium text-slate-900 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" aria-hidden="true" />
                <a href={`mailto:${ticket.studentEmail}`} className="hover:text-primary-600">{ticket.studentEmail}</a>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Assigned To</dt>
              <dd className="text-sm font-medium text-slate-900 flex items-center gap-2">
                {ticket.assignedToName ? (
                  <>
                    <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    {ticket.assignedToName}
                  </>
                ) : (
                  <Badge variant="neutral">Unassigned</Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-500">Created</dt>
              <dd className="text-sm font-medium text-slate-900">{format(new Date(ticket.createdAt), "MMM d, yyyy HH:mm")}</dd>
            </div>
            {ticket.resolvedAt && (
              <div>
                <dt className="text-sm text-slate-500">Resolved</dt>
                <dd className="text-sm font-medium text-slate-900">{format(new Date(ticket.resolvedAt), "MMM d, yyyy HH:mm")}</dd>
              </div>
            )}
            {ticket.closedAt && (
              <div>
                <dt className="text-sm text-slate-500">Closed</dt>
                <dd className="text-sm font-medium text-slate-900">{format(new Date(ticket.closedAt), "MMM d, yyyy HH:mm")}</dd>
              </div>
            )}
          </dl>

          {canAssign && !ticket.assignedToId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                This ticket is not assigned. <button onClick={() => setShowAssignForm(true)} className="text-amber-600 underline hover:text-amber-700">Assign now</button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            {ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {ticket.messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isCurrentUser={message.senderId === currentUserId}
                isStaff={currentUserRole !== "student"}
              />
            ))}
          </div>

          {canReply && ticket.status !== "closed" && (
            <>
              {!showReplyForm && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setShowReplyForm(true)}
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" />
                  Add Reply
                </Button>
              )}

              {showReplyForm && (
                <form onSubmit={handleReplySubmit} className="space-y-4 pt-4 border-t border-slate-200">
                  {replyErrors.form && (
                    <div className="rounded-md bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800">{replyErrors.form}</p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="replyMessage" className="required">
                      Reply
                    </Label>
                    <Textarea
                      id="replyMessage"
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Write your reply..."
                      rows={4}
                      className={cn(replyErrors.message && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                      disabled={isReplying}
                    />
                    {replyErrors.message && <p className="mt-1 text-sm text-red-600">{replyErrors.message}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="isInternal"
                      checked={isInternal}
                      onCheckedChange={setIsInternal}
                    />
                    <Label htmlFor="isInternal" className="cursor-pointer text-sm text-slate-700">
                      Internal note (not visible to student)
                    </Label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setShowReplyForm(false)} disabled={isReplying}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isReplying} className="gap-2">
                      {isReplying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          Sending...
                        </>
                      ) : (
                        "Send Reply"
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}

          {canAssign && !ticket.assignedToId && showAssignForm && (
            <form onSubmit={handleAssign} className="space-y-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-900">Assign Ticket</h4>
              {assignErrors.form && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{assignErrors.form}</p>
                </div>
              )}

              <div>
                <Label htmlFor="assignUserId" className="required">
                  Assign to
                </Label>
                <Select
                  value={assignUserId}
                  onValueChange={setAssignUserId}
                  className={cn("mt-1 w-full", assignErrors.assignedTo && "border-red-500 focus:border-red-500 focus:ring-red-500")}
                >
                  <SelectTrigger id="assignUserId">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Staff options would be loaded here */}
                    <SelectItem value="">Loading staff...</SelectItem>
                  </SelectContent>
                </Select>
                {assignErrors.assignedTo && <p className="mt-1 text-sm text-red-600">{assignErrors.assignedTo}</p>}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowAssignForm(false)} disabled={isAssigning}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAssigning} className="gap-2">
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Assigning...
                    </>
                  ) : (
                    "Assign"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface MessageBubbleProps {
  message: TicketMessage;
  isCurrentUser: boolean;
  isStaff: boolean;
}

function MessageBubble({ message, isCurrentUser, isStaff }: MessageBubbleProps) {
  const isInternal = message.isInternal && isStaff;
  const senderType = message.senderType === "staff" ? "Staff" : "Student";

  if (isInternal && !isStaff) {
    return null;
  }

  return (
    <div className={cn("flex gap-3", isCurrentUser ? "flex-row-reverse" : "")}>
      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", isCurrentUser ? "bg-primary-100" : "bg-slate-100")}>
        {message.senderType === "staff" ? (
          <Shield className={cn("h-4 w-4", isCurrentUser ? "text-primary-600" : "text-slate-600")} aria-hidden="true" />
        ) : (
          <User className={cn("h-4 w-4", isCurrentUser ? "text-primary-600" : "text-slate-600")} aria-hidden="true" />
        )}
      </div>
      <div className={cn("flex-1 min-w-0", isCurrentUser ? "text-right" : "")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900">{message.senderName}</span>
          <span className="text-xs text-slate-500">{senderType}</span>
          {message.isInternal && isStaff && (
            <Badge variant="secondary" className="text-xs">
              Internal
            </Badge>
          )}
          <span className="text-xs text-slate-400">{format(new Date(message.createdAt), "MMM d, yyyy HH:mm")}</span>
        </div>
        <div className={cn("prose prose-sm max-w-none whitespace-pre-wrap", isCurrentUser ? "text-right" : "")}>
          {message.message}
        </div>
        {message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <Mail className="h-3.5 w-3.5" aria-hidden="true" />
            {message.originalFileName || "Attachment"}
          </a>
        )}
      </div>
    </div>
  );
}