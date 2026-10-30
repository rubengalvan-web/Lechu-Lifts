import React from "react";
import { Download } from "lucide-react";
import TrendChart from "./TrendChart.jsx";
import SheetsSync from "./SheetsSync.jsx";

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "numeric", day: "numeric" });
}

function historyToCSV(history) {
  const header = ["date", "day", "title", "sets_completed", "total_sets", "volume_lb"];
  const rows = history.map((h) => [
    new Date(h.date).toISOString(),
    h.dayLabel,
    h.dayTitle,
    h.setsCompleted,
    h.totalSets,
    h.volume,
  ]);
  return [header, ...rows].map((r) => r.join(",")).join("\n");
}

function downloadCSV(history) {
  const csv = historyToCSV(history);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maceta-history-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ProgressView({ history, program, colors, profile }) {
  // history is stored newest-first; charts read left-to-right oldest->newest.
  const chronological = [...history].reverse();
  const overallPoints = chronological.slice(-8).map((h) => ({
    label: formatShortDate(h.date),
    value: h.volume,
  }));

  const days = Object.entries(program);

  return (
    <div className="px-5 py-4">
      <div className="mb-5">
        <div className="text-xs tracking-widest mb-2" style={{ color: colors.inkFaint }}>
          TOTAL VOLUME · LAST 8 SESSIONS
        </div>
        <TrendChart points={overallPoints} color={colors.rust} inkFaint={colors.inkFaint} />
      </div>

      {days.map(([dayId, d]) => {
        // Timed holds (planks, etc.) don't have a meaningful weight x reps
        // volume number, so they're left out of the lift-by-lift charts.
        const exList = d.exercises.filter((ex) => !ex.timed && !ex.repsOnly);
        if (exList.length === 0) return null;
        return (
          <div key={dayId} className="mb-5">
            <div className="stencil text-lg mb-2" style={{ color: colors.ink }}>
              {d.label} — {d.title.toUpperCase()}
            </div>
            {exList.map((ex) => {
              // Only sessions where this lift was actually in the plan (Short
              // weeks skip some), so skipped days don't show as zero bars.
              const points = chronological
                .filter((h) => h.dayId === dayId)
                .map((h) => ({ h, entry: (h.exercises || []).find((e) => e.id === ex.id) }))
                .filter((x) => x.entry)
                .slice(-6)
                .map(({ h, entry }) => ({ label: formatShortDate(h.date), value: entry.volume }));
              const latest = points.length ? points[points.length - 1].value : 0;
              return (
                <div key={ex.id} className="py-2 ruled-row">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: colors.ink }}>
                      {ex.name}
                    </span>
                    <span className="text-[10px]" style={{ color: colors.inkFaint }}>
                      {latest} lb vol
                    </span>
                  </div>
                  <TrendChart points={points} color={colors.olive} inkFaint={colors.inkFaint} />
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="pt-2" style={{ borderTop: `2px solid ${colors.ink}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs tracking-widest" style={{ color: colors.inkFaint }}>
            LOGGED SESSIONS
          </div>
          {history.length > 0 && (
            <button
              onClick={() => downloadCSV(history)}
              className="flex items-center gap-1 text-[10px] px-2 py-1"
              style={{ color: colors.inkFaint, border: `1px solid ${colors.line}` }}
            >
              <Download size={10} /> CSV
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-xs italic" style={{ color: colors.inkFaint }}>
            Nothing logged yet. Finish a session to start your record.
          </p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 8).map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1.5 ruled-row">
                <div>
                  <span className="stencil text-sm mr-2" style={{ color: colors.olive }}>
                    {h.dayLabel}
                  </span>
                  <span style={{ color: colors.inkFaint }}>
                    {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div style={{ color: colors.ink }}>
                  {h.setsCompleted}/{h.totalSets} sets · {h.volume} lb vol
                  {h.durationMin ? ` · ${h.durationMin} min` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetsSync history={history} profile={profile} colors={colors} />
    </div>
  );
}
