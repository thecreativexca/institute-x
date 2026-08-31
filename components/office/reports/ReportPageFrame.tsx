import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportNav } from "./ReportNav";
import type { ReportAbilities } from "@/lib/analytics/permissions";
import { formatTimestamp } from "@/lib/analytics/format";

interface PageHeaderProps {
  title: string;
  description: string;
  current: Parameters<typeof ReportNav>[0]["current"];
  abilities: ReportAbilities;
  /** Renders the filter bar (client) — passed by individual pages. */
  filters?: ReactNode;
  lastUpdated?: Date;
}

/** Standard report page frame: nav + header + filter bar + children. */
export function ReportPageFrame({
  title,
  description,
  current,
  abilities,
  filters,
  lastUpdated,
  children,
}: PageHeaderProps & { children: ReactNode }) {
  return (
    <div className="space-y-5">
      <header className="space-y-3">
        <div>
          <p className="text-sm font-medium text-primary-600">Office Portal</p>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <ReportNav current={current} abilities={abilities} />
        {lastUpdated && (
          <p className="text-xs text-slate-400">Data updated at {formatTimestamp(lastUpdated)}</p>
        )}
      </header>

      {filters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filters</CardTitle>
          </CardHeader>
          <CardContent>{filters}</CardContent>
        </Card>
      )}

      {children}
    </div>
  );
}

/** Permission-denied card used by sub-reports. */
export function ReportDenied({ title = "Access restricted" }: { title?: string }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <CardHeader className="items-center text-center">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-500">
          You do not have permission to view this report.
        </p>
      </CardHeader>
    </Card>
  );
}