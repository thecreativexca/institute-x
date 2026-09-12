import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/analytics/format";

interface KpiCardProps {
  label: string;
  value: number | string;
  /** Human context shown under the value (e.g. "of 120 students"). */
  helper?: string;
  /** Percentage change vs previous period. `undefined` = don't show. */
  deltaPercent?: number | null;
  /** Show a currency marker / format the value as currency. */
  currency?: boolean;
  /** Id for screen readers (tied to the value). */
  id?: string;
}

export function KpiCard({
  label,
  value,
  helper,
  deltaPercent,
  currency = false,
  id,
}: KpiCardProps) {
  const displayValue =
    typeof value === "number"
      ? currency
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(value)
        : formatNumber(value)
      : value;

  return (
    <Card>
      <CardContent className="p-4">
        <p id={id ? `${id}-label` : undefined} className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900" aria-labelledby={id ? `${id}-label` : undefined}>
          {displayValue}
        </p>
        {deltaPercent !== undefined && (
          <p
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              deltaPercent === null
                ? "text-slate-400"
                : deltaPercent > 0
                  ? "text-amber-700"
                  : deltaPercent < 0
                    ? "text-red-600"
                    : "text-slate-500"
            )}
          >
            {deltaPercent === null ? (
              <>
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                New — no previous baseline
              </>
            ) : (
              <>
                {deltaPercent >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {Math.abs(deltaPercent).toFixed(1)}% vs previous period
              </>
            )}
          </p>
        )}
        {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
      </CardContent>
    </Card>
  );
}