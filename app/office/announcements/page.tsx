import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getValidatedSession } from "@/lib/auth/helpers";
import { canAccessOffice, hasPermission, PERMISSIONS } from "@/lib/auth/permissions";
import { getOfficeAnnouncements } from "@/lib/office/announcements/queries";
import { OfficeShell } from "@/components/office/OfficeShell";
import { AnnouncementTable } from "@/components/office/announcements/AnnouncementTable";
import { AnnouncementCard } from "@/components/office/announcements/AnnouncementCard";
import { AnnouncementFilters } from "@/components/office/announcements/AnnouncementFilters";
import { Pagination } from "@/components/office/announcements/Pagination";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Plus } from "lucide-react";
import { announcementFiltersSchema } from "@/lib/office/announcements/validation";

export const metadata: Metadata = {
  title: "Announcements — Office Portal",
  description: "Manage announcements for students and staff.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface AnnouncementListPageProps {
  searchParams: Promise<{
    q?: string;
    audience?: string;
    status?: string;
    sort?: string;
    dir?: string;
    page?: string;
    limit?: string;
  }>;
}

export default async function AnnouncementListPage({ searchParams }: AnnouncementListPageProps) {
  const { user } = await getValidatedSession();
  const params = await searchParams;

  if (!user) {
    redirect("/login?callbackUrl=/office/announcements");
  }

  if (!canAccessOffice(user.role)) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to access the announcement management portal.
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

  const canManage = hasPermission(user.role, PERMISSIONS.ANNOUNCEMENTS_MANAGE);

  if (!canManage) {
    return (
      <OfficeShell session={user}>
        <Card className="mx-auto mt-10 max-w-lg">
          <CardHeader className="items-center text-center">
            <CardTitle>Access restricted</CardTitle>
            <CardDescription>
              You do not have permission to manage announcements.
            </CardDescription>
          </CardHeader>
        </Card>
      </OfficeShell>
    );
  }

  const parsedParams = announcementFiltersSchema.safeParse(params);
  const vp = parsedParams.success ? parsedParams.data : announcementFiltersSchema.parse({});

  const filters = {
    search: vp.search,
    audience: vp.audience,
    status: vp.status,
  };

  const sort = {
    field: vp.sort,
    direction: vp.direction,
  };

  const pagination = {
    page: vp.page,
    limit: vp.limit,
  };

  const result = await getOfficeAnnouncements(filters, sort, pagination);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <div className="office-page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">Communication desk</p>
              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Announcements</h1>
              <p className="mt-1 text-sm text-slate-500">
                Create and manage announcements for students and staff.
              </p>
            </div>
            <Button asChild className="rounded-xl shadow-sm">
              <Link href="/office/announcements/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Create Announcement
              </Link>
            </Button>
          </div>

          <Card className="overflow-hidden border-slate-200/80 shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" aria-hidden="true" />
                Announcements
              </CardTitle>
              <CardDescription>
                {result.total} announcement{result.total !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnnouncementFilters
                initialFilters={filters}
                initialSort={sort}
              />
            </CardContent>
          </Card>
        </header>

        {result.announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              {Object.keys(filters).some((k) => filters[k as keyof typeof filters]) ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No announcements match your filters</h3>
                  <p className="mt-2 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/office/announcements">
                      <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                      Clear all filters
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true" />
                  <h3 className="mt-4 text-lg font-medium text-slate-900">No announcements found</h3>
                  <p className="mt-2 text-sm text-slate-500">Create your first announcement to get started.</p>
                  <Button className="mt-4" asChild>
                    <Link href="/office/announcements/new">
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      Create Announcement
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="hidden overflow-hidden border-slate-200/80 shadow-card lg:block">
              <CardContent className="p-0">
                <AnnouncementTable
                  announcements={result.announcements}
                />
              </CardContent>
            </Card>

            <div className="space-y-3 lg:hidden">
              {result.announcements.map((announcement) => (
                <AnnouncementCard key={announcement.id} announcement={announcement} />
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
