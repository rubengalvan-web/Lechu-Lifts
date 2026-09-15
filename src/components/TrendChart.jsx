import React from "react";

// Minimal dependency-free bar chart, drawn as inline SVG so it scales with
// its container and stays crisp on any screen — no charting library needed.
export default function TrendChart({ points, color, inkFaint }) {
  if (!points.length) {
    return (
      <div className="text-[11px] italic py-2" style={{ color: inkFaint }}>
        No sessions logged yet
      </div>
    );
  }

  const max = Math.max(...points.map((p) => p.value), 1);
  const w = 260;
  const h = 60;
  const gap = 4;
  const barW = (w - gap * (points.length - 1)) / points.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      {points.map((p, i) => {
        const barH = Math.max(2, (p.value / max) * (h - 16));
        const x = i * (barW + gap);
        const y = h - barH - 14;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={color} />
            <text
              x={x + barW / 2}
              y={h - 3}
              fontSize="7"
              textAnchor="middle"
              fill={inkFaint}
              fontFamily="IBM Plex Mono, monospace"
            >
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
