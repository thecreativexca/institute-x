"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentPageHeader } from "@/components/student/student-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronRight, HelpCircle, MessageSquare, LifeBuoy, Send, ArrowLeft, ExternalLink, Shield, User } from "lucide-react";
import type { StudentTicketSummary, StudentTicketDetail, TicketMessage } from "@/lib/support";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";

const statusConfig = {
  open: { label: "Open", variant: "default" as const },
  in_progress: { label: "In Progress", variant: "primary" as const },
  waiting_for_student: { label: "Waiting for You", variant: "warning" as const },
  resolved: { label: "Resolved", variant: "success" as const },
  closed: { label: "Closed", variant: "neutral" as const },
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

export function StudentSupportClient() {
  const [activeTab, setActiveTab] = useState<"tickets" | "new" | "detail">("tickets");
  const [selectedTicket, setSelectedTicket] = useState<StudentTicketDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [tickets, setTickets] = useState<StudentTicketSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/student/support");
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetail = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/student/support/${ticketId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedTicket(data.ticket);
        setActiveTab("detail");
      }
    } catch (error) {
      console.error("Failed to fetch ticket detail:", error);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      subject: formData.get("subject") as string,
      category: formData.get("category") as string,
      message: formData.get("message") as string,
      courseId: formData.get("courseId") as string | null,
    };

    try {
      const res = await fetch("/api/student/support", {
        method: "POST",
        body: new URLSearchParams(data as Record<string, string>),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setActiveTab("tickets");
        setFormErrors({});
        (e.target as HTMLFormElement).reset();
        await fetchTickets();
      } else {
        setFormErrors({ form: result.error || "Failed to create ticket" });
      }
    } catch {
      setFormErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsReplying(true);
    try {
      const res = await fetch(`/api/student/support/${selectedTicket?.id}`, {
        method: "PATCH",
        body: new URLSearchParams({ message: replyMessage.trim() }),
      });

      if (res.ok) {
        setReplyMessage("");
        await fetchTicketDetail(selectedTicket!.id);
      }
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const canReply = Boolean(selectedTicket && selectedTicket.status !== "closed");

  return (
      <div className="mx-auto max-w-4xl space-y-6">
        <StudentPageHeader
          title="Support"
          description="Get help with courses, payments, certificates, your account or technical issues."
          icon={<LifeBuoy className="h-6 w-6" aria-hidden="true" />}
          eyebrow="Help centre"
        />

        {/* Tabs */}
        <Card className="overflow-hidden rounded-2xl border-primary-100">
          <CardHeader className="border-b border-primary-100 bg-primary-50/60 pb-3">
            <div className="flex gap-2 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-primary-100">
              <Button
                variant={activeTab === "tickets" ? "primary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => { setActiveTab("tickets"); fetchTickets(); }}
              >
                <HelpCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                My Tickets
              </Button>
              <Button
                variant={activeTab === "new" ? "primary" : "ghost"}
                size="sm"
                className="flex-1"
                onClick={() => setActiveTab("new")}
              >
                <MessageSquare className="h-4 w-4 mr-2" aria-hidden="true" />
                New Ticket
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activeTab === "tickets" && (
              <>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary-600" aria-hidden="true" />
                  </div>
                ) : tickets.length === 0 ? (
                  <EmptyState
                    icon={<HelpCircle className="h-12 w-12" aria-hidden="true" />}
                    title="No support tickets yet"
                    description="Your submitted support tickets will appear here."
                    action={
                      <Button onClick={() => setActiveTab("new")}>
                        Create New Ticket
                      </Button>
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <StudentTicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => fetchTicketDetail(ticket.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "new" && (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                {formErrors.form && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-800">{formErrors.form}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="subject" className="required">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Brief description of your issue"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="required">
                    Category
                  </Label>
                  <Select value="" onValueChange={() => {}} required disabled={isSubmitting}>
                    <SelectTrigger id="category" name="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course_access">Course Access</SelectItem>
                      <SelectItem value="payment">Billing & Payments</SelectItem>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                      <SelectItem value="account">Account Access</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="courseId">Related Course (Optional)</Label>
                  <Select value="" onValueChange={() => {}}>
                    <SelectTrigger id="courseId" name="courseId">
                      <SelectValue placeholder="Select a course (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No specific course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message" className="required">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Describe your issue in detail..."
                    rows={6}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </form>
            )}

            {activeTab === "detail" && selectedTicket && (
              <StudentTicketDetailView
                ticket={selectedTicket}
                replyMessage={replyMessage}
                setReplyMessage={setReplyMessage}
                isReplying={isReplying}
                onReply={handleReply}
                canReply={canReply}
                onBack={() => { setActiveTab("tickets"); setSelectedTicket(null); }}
              />
            )}
          </CardContent>
        </Card>

        {/* Quick Help */}
        <Card className="rounded-2xl border-primary-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <LifeBuoy className="h-5 w-5 text-primary-600" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-base">Quick Help</CardTitle>
                <CardDescription className="text-xs">Common questions and resources</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button asChild variant="outline" className="flex h-auto flex-col items-start gap-3 rounded-xl border-primary-100 p-4 text-left hover:bg-primary-50">
                <Link href="/faq">
                  <HelpCircle className="h-6 w-6" aria-hidden="true" />
                  <span className="font-medium">FAQ</span>
                  <span className="text-sm text-slate-500">Frequently asked questions</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex h-auto flex-col items-start gap-3 rounded-xl border-primary-100 p-4 text-left hover:bg-primary-50">
                <Link href="/contact">
                  <MessageSquare className="h-6 w-6" aria-hidden="true" />
                  <span className="font-medium">Contact Us</span>
                  <span className="text-sm text-slate-500">Send us a message</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex h-auto flex-col items-start gap-3 rounded-xl border-primary-100 p-4 text-left hover:bg-primary-50">
                <Link href="/student/courses">
                  <ChevronRight className="h-6 w-6 rotate-90" aria-hidden="true" />
                  <span className="font-medium">Course Help</span>
                  <span className="text-sm text-slate-500">Issues with course content</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex h-auto flex-col items-start gap-3 rounded-xl border-primary-100 p-4 text-left hover:bg-primary-50">
                <Link href="/student/profile">
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                  <span className="font-medium">Account Help</span>
                  <span className="text-sm text-slate-500">Profile and settings issues</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}

interface StudentTicketCardProps {
  ticket: StudentTicketSummary;
  onClick: () => void;
}

function StudentTicketCard({ ticket, onClick }: StudentTicketCardProps) {
  const statusCfg = statusConfig[ticket.status];
  const priorityCfg = priorityConfig[ticket.priority];
  const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

  return (
    <div
      onClick={onClick}
      className="border border-slate-200 rounded-lg bg-white p-4 hover:bg-slate-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-primary-600">{ticket.ticketNumber}</span>
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
          </div>
          <h3 className="font-medium text-slate-900 truncate">{ticket.subject}</h3>
          <p className="text-sm text-slate-500 mt-1">{categoryLabel}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-slate-500">
            {format(new Date(ticket.lastMessageAt), "MMM d, HH:mm")}
          </span>
          <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

interface StudentTicketDetailViewProps {
  ticket: StudentTicketDetail;
  replyMessage: string;
  setReplyMessage: (msg: string) => void;
  isReplying: boolean;
  onReply: (e: React.FormEvent<HTMLFormElement>) => void;
  canReply: boolean;
  onBack: () => void;
}

function StudentTicketDetailView({
  ticket,
  replyMessage,
  setReplyMessage,
  isReplying,
  onReply,
  canReply,
  onBack,
}: StudentTicketDetailViewProps) {
  const statusCfg = statusConfig[ticket.status];
  const priorityCfg = priorityConfig[ticket.priority];
  const categoryLabel = categoryLabels[ticket.category] ?? ticket.category;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
          Back
        </Button>
        <div>
          <p className="text-sm font-medium text-primary-600">{ticket.ticketNumber}</p>
          <h2 className="text-xl font-bold text-slate-900">{ticket.subject}</h2>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
            <Badge variant={priorityCfg.variant}>{priorityCfg.label}</Badge>
            <Badge variant="secondary">{categoryLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {ticket.messages.map((message) => (
              <StudentMessageBubble key={message.id} message={message} />
            ))}
          </div>

          {canReply && (
            <form onSubmit={onReply} className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <Label htmlFor="replyMessage" className="required">
                  Your Reply
                </Label>
                <Textarea
                  id="replyMessage"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your reply..."
                  rows={4}
                  required
                  disabled={isReplying}
                />
              </div>
              <Button type="submit" disabled={isReplying} className="gap-2">
                {isReplying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send Reply
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentMessageBubble({ message }: { message: TicketMessage }) {
  const isStudent = message.senderType === "student";

  return (
    <div className={cn("flex gap-3", isStudent ? "flex-row-reverse" : "")}>
      <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", isStudent ? "bg-primary-100" : "bg-slate-100")}>
        {message.senderType === "staff" ? (
          <Shield className={cn("h-4 w-4", isStudent ? "text-primary-600" : "text-slate-600")} aria-hidden="true" />
        ) : (
          <User className={cn("h-4 w-4", isStudent ? "text-primary-600" : "text-slate-600")} aria-hidden="true" />
        )}
      </div>
      <div className={cn("flex-1 min-w-0", isStudent ? "text-right" : "")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-slate-900">{message.senderName}</span>
          <span className="text-xs text-slate-500 capitalize">{message.senderType}</span>
          <span className="text-xs text-slate-400">{format(new Date(message.createdAt), "MMM d, yyyy HH:mm")}</span>
        </div>
        <div className={cn("prose prose-sm max-w-none whitespace-pre-wrap", isStudent ? "text-right" : "")}>
          {message.message}
        </div>
        {message.attachmentUrl && (
          <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            {message.originalFileName || "Attachment"}
          </a>
        )}
      </div>
    </div>
  );
}
