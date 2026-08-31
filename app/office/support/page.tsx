import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeSupportTickets, getSupportStats } from "@/lib/support/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { SupportTable } from "@/components/office/support/SupportTable";
import { SupportCard } from "@/components/office/support/SupportCard";
import { SupportFilters } from "@/components/office/support/SupportFilters";
import { Pagination } from "@/components/office/support/Pagination";
import { SupportStatsCards } from "@/components/office/support/SupportStatsCards";
import { Course } from "@/models/Course";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";
import { supportFiltersSchema } from "@/lib/support/validation";

export const metadata: Metadata = {
  title: "Support — Office Portal",
  description: "Manage student support tickets.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SupportListPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    category?: string;
    assigned?: string;
    unassigned?: string;
    course?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function SupportListPage({ searchParams }: SupportListPageProps) {
  const { user } = await getValidatedSession();
  const params = await searchParams;

  if (!user) {
    redirect("/login?callbackUrl=/office/support");
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
            <Link href="/" className="text-primary-600 hover:underline">Back to Home</Link>
          </CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const canRead = hasPermission(user.role, PERMISSIONS.SUPPORT_READ);
  const canManage = hasPermission(user.role, PERMISSIONS.SUPPORT_MANAGE);
  const canReply = hasPermission(user.role, PERMISSIONS.SUPPORT_REPLY);
  const canAssign = hasPermission(user.role, PERMISSIONS.SUPPORT_ASSIGN);

  if (!canRead) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to view support tickets.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const parsedParams = supportFiltersSchema.safeParse(params);
  const vp = parsedParams.success ? parsedParams.data : supportFiltersSchema.parse({});

  const filters = {
    search: vp.search,
    status: vp.status,
    priority: vp.priority,
    category: vp.category,
    assignedToMe: vp.assignedToMe,
    unassigned: vp.unassigned,
    courseId: vp.courseId,
  };

  const sort = {
    field: vp.sort,
    direction: vp.direction,
  };

  const pagination = {
    page: vp.page,
    limit: vp.limit,
  };

  const [result, courses, stats] = await Promise.all([
    getOfficeSupportTickets(filters, sort, pagination, user.id, user.role),
    Course.find({ status: "published" }).select("name").lean(),
    getSupportStats(),
  ]);

  const courseOptions = courses.map((c) => ({ id: c._id.toString(), name: c.name }));

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="office-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Learner care</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Support Tickets</h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage student support tickets and track resolutions.
              </p>
            </div>
          </div>

          <SupportStatsCards stats={stats} />

          <Card className="mt-6 overflow-hidden border-slate-200/80 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden="true" />
                Tickets
              </CardTitle>
              <CardDescription>
                {result.total} ticket{result.total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SupportFilters
                initialFilters={filters}
                initialSort={sort}
                courses={courseOptions}
              />
            </CardContent>
          </Card>
        </header>

        {result.tickets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No tickets match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
<Link href="/office/support" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                    <Filter className="h-4 w-4" aria-hidden="true" />
                    Clear all filters
                  </Link>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No support tickets found</h3>
                  <p className="mt-2 text-sm text-slate-500">No tickets have been created yet.</p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="hidden overflow-hidden border-slate-200/80 shadow-card lg:block">
              <CardContent className="p-0">
                <SupportTable
                  tickets={result.tickets}
                  canManage={canManage}
                  canReply={canReply}
                  canAssign={canAssign}
                />
              </CardContent>
            </Card>

            <div className="space-y-3 lg:hidden">
              {result.tickets.map((ticket) => (
                <SupportCard key={ticket.id} ticket={ticket} canManage={canManage} canReply={canReply} canAssign={canAssign} />
              ))}
            </div>

            <Pagination
              currentPage={result.page}
              totalPages={result.totalPages}
              totalItems={result.total}
              itemsPerPage={result.limit}
            />
          </>
        )}
      </div>
    </OfficeShell>
  );
}
