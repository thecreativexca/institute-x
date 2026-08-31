"use client";

interface Slice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  data: Slice[];
  /** Total value label suffix shown in the center. */
  center?: string;
}

const R = 42;
const C = 2 * Math.PI * R;

/** Donut/pie chart for status distributions with FEW categories (spec §77/§78). */
export function DonutChart({ title, data, center }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <div className="py-10 text-center text-sm text-slate-400">No data available for this period.</div>;
  }

  const filtered = data.filter((d) => d.value > 0);
  // Prefix sums computed without mutating a variable during render.
  const startSums = filtered.map((_, i) =>
    filtered.slice(0, i).reduce((s, d) => s + d.value, 0)
  );
  const segments = filtered.map((d, i) => {
    const startAngle = (startSums[i] / total) * 360;
    const endAngle = ((startSums[i] + d.value) / total) * 360;
    return { ...d, startAngle, endAngle };
  });

  const polar = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0" role="img" aria-label={title}>
          {segments.map((s) => {
            const start = polar(s.startAngle, R);
            const end = polar(s.endAngle, R);
            const largeArc = s.endAngle - s.startAngle > 180 ? 1 : 0;
            const d = `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
            return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth={14} />;
          })}
          <text x="50" y="48" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0f172a">
            {total}
          </text>
          <text x="50" y="60" textAnchor="middle" fontSize="7" fill="#64748b">
            {center ?? "total"}
          </text>
        </svg>
        <ul className="space-y-1.5 text-sm">
          {data.map((d) => (
            <li key={d.label} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} aria-hidden="true" />
              <span className="text-slate-600">{d.label}</span>
              <span className="ml-auto font-semibold text-slate-900">{d.value}</span>
              <span className="w-12 text-right text-xs text-slate-400">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}