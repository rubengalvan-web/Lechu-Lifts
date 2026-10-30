import React from "react";

export function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// Sticky bottom bar: counts down the rest after a set, then says GO.
export default function RestBar({ rest, now, colors, onSkip }) {
  if (!rest) return null;
  const remaining = Math.ceil((rest.endsAt - now) / 1000);
  const go = remaining <= 0;
  return (
    <div
      className="fixed left-0 right-0 bottom-0 flex justify-center px-3 z-20"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div
        className="w-full max-w-md flex items-center justify-between px-4 py-3"
        style={{ background: go ? colors.olive : colors.ink, color: colors.paper }}
        role="status"
        aria-live="polite"
      >
        <div className="min-w-0">
          <div className="stencil text-3xl leading-none">{go ? "GO" : `REST ${fmtClock(remaining)}`}</div>
          <div className="text-xs mt-1 truncate">Next: {rest.next}</div>
        </div>
        <button
          onClick={onSkip}
          className="text-sm px-3 py-1.5 shrink-0 ml-3"
          style={{ border: `1px solid ${colors.paper}`, color: colors.paper }}
        >
          {go ? "CLOSE" : "SKIP"}
        </button>
      </div>
    </div>
  );
}
