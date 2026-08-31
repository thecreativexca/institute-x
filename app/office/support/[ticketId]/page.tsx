import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeTicketDetail } from "@/lib/support/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SupportDetail } from "@/components/office/support/SupportDetail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Support Ticket — Office Portal",
  description: "View and manage support ticket.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SupportDetailPageProps {
  params: Promise<{ ticketId: string }>;
}

export default async function SupportDetailPage({ params }: SupportDetailPageProps) {
  const { user } = await getValidatedSession();
  const { ticketId } = await params;

  if (!user) {
    redirect(`/login?callbackUrl=/office/support/${ticketId}`);
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the support management portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  if (!hasPermission(user.role, PERMISSIONS.SUPPORT_READ)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view this ticket.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const ticket = await getOfficeTicketDetail(ticketId, user.id, user.role);

  if (!ticket) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Ticket not found</CardTitle>
            <CardDescription>
              The ticket you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link href="/office/support">Back to Support</Link>
            </Button>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const canManage = hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE);
  const canReply = hasPermission(user.role, PERMISSIONS.SUPPORT_REPLY);
  const canAssign = hasPermission(user.role, PERMISSIONS.SUPPORT_ASSIGN);

  return (
    <OfficeShell session={user}>
      <div className="max-w-4xl">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/office/support">
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Back
              </Link>
            </Button>
            <div>
              <p className="text-sm font-medium text-primary-600">Office Portal</p>
              <h1 className="text-2xl font-bold text-slate-900">{ticket.ticketNumber} - {ticket.subject}</h1>
            </div>
          </div>
        </header>

        <SupportDetail
          ticket={ticket}
          canManage={canManage}
          canReply={canReply}
          canAssign={canAssign}
          currentUserId={user.id}
          currentUserRole={user.role}
          currentUserName={user.name}
        />
      </div>
    </OfficeShell>
  );
}
