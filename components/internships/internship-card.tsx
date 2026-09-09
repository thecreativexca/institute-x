import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  Clock3,
  MapPin,
  Users,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

const statusVariants: Record<
  string,
  "primary" | "success" | "warning" | "danger" | "neutral"
> = {
  pending: "warning",
  approved: "success",
  waitlisted: "neutral",
  rejected: "danger",
  withdrawn: "neutral",
  selected: "primary",
  active: "success",
  paused: "warning",
  completed: "success",
  removed: "danger",
  open: "success",
  running: "primary",
  draft: "neutral",
  archived: "neutral",
  "not eligible": "warning",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

function formatDate(value?: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

interface StudentInternshipCardProps {
  row: any;
}

export function StudentInternshipCard({ row }: StudentInternshipCardProps) {
  const { eligibility, application, enrollment, ...internship } = row;
  const status =
    enrollment?.status ||
    application?.status ||
    (eligibility.eligible ? internship.status : "not eligible");
  const cta = enrollment
    ? "Continue internship"
    : application
      ? "View application"
      : "View details";

  return (
    <Card
      className="group flex h-full flex-col overflow-hidden rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
    >
      <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500" />
      <CardContent className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </span>
          <Badge variant={statusVariants[status] ?? "neutral"}>
            {formatStatus(status)}
          </Badge>
        </div>

        <h2 className="mt-4 text-base font-semibold leading-snug text-slate-900">
          {internship.title}
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {internship.shortDescription || internship.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <MetaChip icon={Clock3}>
            {internship.durationValue} {internship.durationUnit}
          </MetaChip>
          <MetaChip icon={MapPin} className="capitalize">
            {internship.mode}
          </MetaChip>
          <MetaChip icon={WalletCards} className="capitalize">
            {internship.paidOrUnpaid === "paid" && internship.stipendAmount
              ? `₹${internship.stipendAmount.toLocaleString("en-IN")} stipend`
              : internship.paidOrUnpaid}
          </MetaChip>
          {internship.applicationEndDate ? (
            <MetaChip icon={Calendar}>
              Apply by {formatDate(internship.applicationEndDate)}
            </MetaChip>
          ) : null}
        </div>

        {internship.skillsRequired?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {internship.skillsRequired.slice(0, 3).map((skill: string) => (
              <Badge key={skill} variant="neutral" className="text-[11px]">
                {skill}
              </Badge>
            ))}
            {internship.skillsRequired.length > 3 ? (
              <Badge variant="neutral" className="text-[11px]">
                +{internship.skillsRequired.length - 3} more
              </Badge>
            ) : null}
          </div>
        ) : null}

        {!eligibility.eligible && !application && !enrollment ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {eligibility.reason}
          </p>
        ) : null}

        <div className="mt-auto pt-5">
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/student/internships/${internship._id}`}>
              {cta}
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface OfficeInternshipCardProps {
  internship: any;
}

export function OfficeInternshipCard({ internship }: OfficeInternshipCardProps) {
  return (
    <Link href={`/office/internships/${internship._id}`} className="block h-full">
      <Card
        className="group h-full overflow-hidden rounded-2xl border-primary-100 transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-card-hover"
      >
        <div className="h-1.5 bg-gradient-to-r from-primary-500 via-accent-400 to-primary-500" />
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </span>
            <Badge variant={statusVariants[internship.status] ?? "neutral"}>
              {formatStatus(internship.status)}
            </Badge>
          </div>

          <h2 className="mt-4 font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary-700">
            {internship.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {internship.shortDescription || internship.description}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <MetaChip icon={Clock3}>
              {internship.durationValue} {internship.durationUnit}
            </MetaChip>
            <MetaChip icon={MapPin} className="capitalize">
              {internship.mode}
            </MetaChip>
            <MetaChip icon={Users}>
              {internship.seats} seats
            </MetaChip>
            {internship.applicationEndDate ? (
              <MetaChip icon={Calendar}>
                Deadline {formatDate(internship.applicationEndDate)}
              </MetaChip>
            ) : null}
          </div>

          {internship.skillsRequired?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {internship.skillsRequired.slice(0, 2).map((skill: string) => (
                <Badge key={skill} variant="neutral" className="text-[11px]">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : null}

          <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary-700">
            Manage program
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function MetaChip({
  icon: Icon,
  children,
  className,
}: {
  icon: typeof Clock3;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      {children}
    </span>
  );
}
