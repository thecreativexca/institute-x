import type { Metadata } from "next";
import Link from "next/link";

import { Award, BadgeCheck, Ban, CalendarPlus, Upload } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { CertificateManager } from "@/components/office/certificates/certificate-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/helpers";
import {
  getOfficeCertificateStats,
  listCourseOptions,
  listOfficeCertificates,
} from "@/lib/office/certificates/queries";
import { certificateFiltersSchema } from "@/lib/office/certificates/validation";

export const metadata: Metadata = {
  title: "Certificates — Office Portal",
  description: "Issue, review and manage student certificates.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Admin Certificate Management (spec §1, §14).
 *
 * Server component: the admin guard runs first (`requireAdmin` redirects a
 * non-admin to the office login), then filters are parsed from the URL, and the
 * stats + list + course options are fetched in parallel. The client manager
 * below only owns dialog state.
 */
export default async function OfficeCertificatesPage({ searchParams }: PageProps) {
  const { user } = await requireAdmin();
  if (!user) return null;

  const raw = await searchParams;

  /*
   * Unknown/malformed query values fall back to the schema defaults instead of
   * throwing, so a hand-edited URL can never 500 this page.
   */
  const parsedFilters = certificateFiltersSchema.safeParse(
    Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [
          key,
          Array.isArray(value) ? value[0] : value,
        ])
        .filter(([, value]) => typeof value === "string" && value !== "")
    )
  );
  const filters = parsedFilters.success
    ? parsedFilters.data
    : certificateFiltersSchema.parse({});

  const [result, stats, courses] = await Promise.all([
    listOfficeCertificates(filters),
    getOfficeCertificateStats(),
    listCourseOptions(),
  ]);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header className="office-page-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600">
              Credentials
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-slate-900 sm:text-3xl">
              Certificates
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Issue certificates to students, replace files, and revoke invalid
              credentials with a permanent audit trail.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/office/certificates/revoked">
                <Ban className="h-4 w-4" aria-hidden="true" /> Revoked
              </Link>
            </Button>
            <Button asChild>
              <Link href="/office/certificates/upload">
                <Upload className="h-4 w-4" aria-hidden="true" /> Upload Certificate
              </Link>
            </Button>
          </div>
        </header>

        <section
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Certificate statistics"
        >
          <Summary icon={Award} label="Total Certificates" value={stats.total} />
          <Summary icon={BadgeCheck} label="Active" value={stats.active} />
          <Summary icon={Ban} label="Revoked" value={stats.revoked} />
          <Summary
            icon={CalendarPlus}
            label="Issued This Month"
            value={stats.issuedThisMonth}
          />
        </section>

        <CertificateManager
          result={result}
          filters={filters}
          courses={courses.map((course) => ({ id: course.id, label: course.label }))}
        />
      </div>
    </OfficeShell>
  );
}

function Summary({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Award;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-primary-700" aria-hidden="true" />
        <div>
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
