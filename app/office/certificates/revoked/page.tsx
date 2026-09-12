import type { Metadata } from "next";
import Link from "next/link";

import { ArrowLeft, Ban } from "lucide-react";

import { OfficeShell } from "@/components/office/OfficeShell";
import { CertificateManager } from "@/components/office/certificates/certificate-manager";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/helpers";
import { listCourseOptions, listOfficeCertificates } from "@/lib/office/certificates/queries";
import { certificateFiltersSchema } from "@/lib/office/certificates/validation";

export const metadata: Metadata = {
  title: "Revoked Certificates — Office Portal",
  description: "Review and reactivate revoked certificates.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Revoked Certificates (spec §7).
 *
 * A focused view of revoked records: nothing is deleted when a certificate is
 * revoked, so this is where an admin reviews the reason and either leaves it
 * revoked or restores it. The status filter is pinned to `revoked` server-side —
 * the client cannot widen it through the query string.
 */
export default async function RevokedCertificatesPage({ searchParams }: PageProps) {
  const { user } = await requireAdmin();
  if (!user) return null;

  const raw = await searchParams;
  const parsed = certificateFiltersSchema.safeParse(
    Object.fromEntries(
      Object.entries(raw)
        .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
        .filter(([, value]) => typeof value === "string" && value !== "")
    )
  );

  // Status is forced AFTER parsing so a crafted `?status=issued` cannot widen
  // this view beyond revoked records.
  const filters = {
    ...(parsed.success ? parsed.data : certificateFiltersSchema.parse({})),
    status: "revoked" as const,
  };

  const [result, courses] = await Promise.all([
    listOfficeCertificates(filters),
    listCourseOptions(),
  ]);

  return (
    <OfficeShell session={user}>
      <div className="space-y-6">
        <header>
          <Button asChild variant="ghost" size="sm" className="mb-3 -ml-2">
            <Link href="/office/certificates">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Certificates
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
              <Ban className="h-5 w-5 text-red-700" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Revoked Certificates
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Revoked certificates stay on record and fail public verification.
                Reactivate one to make it valid again.
              </p>
            </div>
          </div>
        </header>

        <CertificateManager
          result={result}
          filters={filters}
          courses={courses.map((course) => ({ id: course.id, label: course.label }))}
          variant="revoked"
        />
      </div>
    </OfficeShell>
  );
}
