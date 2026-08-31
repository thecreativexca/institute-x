"use client";

interface BarRow {
  label: string;
  value: number;
  sub?: string;
}

interface BarListProps {
  title: string;
  rows: BarRow[];
  formatValue?: (value: number) => string;
  color?: string;
}

/** Horizontal bar list — best for top-N course rankings (spec §77). */
export function BarList({ title, rows, formatValue, color = "#2aa35f" }: BarListProps) {
  if (rows.length === 0) {
    return <div className="py-10 text-center text-sm text-slate-400">No data available for this period.</div>;
  }
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <ul className="space-y-2.5">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate font-medium text-slate-800">{r.label}</span>
                <span className="ml-2 font-semibold text-slate-900">
                  {formatValue ? formatValue(r.value) : r.value}
                </span>
              </div>
              {r.sub && <span className="text-xs text-slate-400">{r.sub}</span>}
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100" role="img" aria-label={`${r.label}: ${r.value}`}>
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${Math.max(1, (r.value / max) * 100)}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
