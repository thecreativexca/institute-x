"use client";

import { useId } from "react";

interface SeriesPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  title: string;
  data: SeriesPoint[];
  formatValue?: (value: number) => string;
  color?: string;
}

const W = 640;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 8 };

/** Lightweight SVG line/area chart (no heavy dependency, spec §75). */
export function LineChart({ title, data, formatValue, color = "#1c854d" }: LineChartProps) {
  const uid = useId();
  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-slate-400">
        No data available for this period.
      </div>
    );
  }
  const max = Math.max(1, ...data.map((d) => d.value));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const points = data.map((d, i) => ({
    x: PAD.left + i * stepX,
    y: PAD.top + innerH - (d.value / max) * innerH,
    ...d,
  }));

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PAD.left},${PAD.top + innerH} ${line} ${PAD.left + (data.length - 1) * stepX},${PAD.top + innerH}`;

  // Show ~6 evenly spaced x labels max to avoid crowding.
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        className="h-auto w-full"
      >
        <line
          x1={PAD.left}
          y1={PAD.top + innerH}
          x2={W - PAD.right}
          y2={PAD.top + innerH}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD.left}
            y1={PAD.top + innerH - innerH * f}
            x2={W - PAD.right}
            y2={PAD.top + innerH - innerH * f}
            stroke="#f1f5f9"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        ))}
        <polygon fill={color} fillOpacity={0.08} points={area} />
        <polyline
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={line}
        />
        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <g key={p.label}>
              <circle cx={p.x} cy={p.y} r={3} fill={color} stroke="#fff" strokeWidth={1.5}>
                <title>{`${p.label}: ${formatValue ? formatValue(p.value) : p.value}`}</title>
              </circle>
              <text x={p.x} y={H - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {p.label}
              </text>
            </g>
          ) : (
            <circle key={p.label} cx={p.x} cy={p.y} r={2.5} fill={color} stroke="#fff">
              <title>{`${p.label}: ${formatValue ? formatValue(p.value) : p.value}`}</title>
            </circle>
          )
        )}
      </svg>
      <p className="sr-only" id={`${uid}-legend`}>
        {title}. {data.map((d) => `${d.label}: ${formatValue ? formatValue(d.value) : d.value}`).join(", ")}
      </p>
    </div>
  );
}
