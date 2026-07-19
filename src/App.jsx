import React, { useState, useEffect, useCallback } from "react";
import { Check, Dumbbell, ChevronRight, RotateCcw, Loader2, Download } from "lucide-react";
import { PROGRAM, COLORS } from "./data/program.js";
import { storage } from "./lib/storage.js";

function emptySets(count) {
  return Array.from({ length: count }, () => ({ weight: "", reps: "", done: false }));
}

function emptyExercises(dayId) {
  const out = {};
  PROGRAM[dayId].exercises.forEach((ex) => {
    out[ex.id] = emptySets(ex.sets);
  });
  return out;
}

function todayLabel() {
  const d = new Date();
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
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

export default function App() {
  const [selectedDay, setSelectedDay] = useState("day1");
  const [exercises, setExercises] = useState(() => emptyExercises("day1"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [stampVisible, setStampVisible] = useState(false);
  const [error, setError] = useState(null);

  // Load history once
  useEffect(() => {
    (async () => {
      try {
        const res = await storage.get("history", false);
        setHistory(res ? JSON.parse(res.value) : []);
      } catch {
        setHistory([]);
      }
    })();
  }, []);

  // Load active session whenever day changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await storage.get(`active-session:${selectedDay}`, false);
        if (!cancelled) {
          setExercises(res ? JSON.parse(res.value) : emptyExercises(selectedDay));
        }
      } catch {
        if (!cancelled) setExercises(emptyExercises(selectedDay));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const persist = useCallback(async (dayId, data) => {
    setSaving(true);
    try {
      await storage.set(`active-session:${dayId}`, JSON.stringify(data), false);
    } catch {
      setError("Couldn't save — check your browser storage.");
    } finally {
      setSaving(false);
    }
  }, []);

  function updateSet(exId, idx, field, value) {
    setExercises((prev) => {
      const next = { ...prev, [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)) };
      persist(selectedDay, next);
      return next;
    });
  }

  function toggleDone(exId, idx) {
    setExercises((prev) => {
      const next = {
        ...prev,
        [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, done: !s.done } : s)),
      };
      persist(selectedDay, next);
      return next;
    });
  }

  const allSets = Object.values(exercises).flat();
  const doneCount = allSets.filter((s) => s.done).length;
  const totalCount = allSets.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  async function completeWorkout() {
    const volume = allSets.reduce((sum, s) => {
      const w = parseFloat(s.weight) || 0;
      const r = parseFloat(s.reps) || 0;
      return s.done ? sum + w * r : sum;
    }, 0);

    const summary = {
      date: new Date().toISOString(),
      dayId: selectedDay,
      dayLabel: PROGRAM[selectedDay].label,
      dayTitle: PROGRAM[selectedDay].title,
      setsCompleted: doneCount,
      totalSets: totalCount,
      volume: Math.round(volume),
    };

    const nextHistory = [summary, ...history].slice(0, 200);
    setHistory(nextHistory);
    setStampVisible(true);

    try {
      await storage.set("history", JSON.stringify(nextHistory), false);
      await storage.delete(`active-session:${selectedDay}`, false);
    } catch {
      setError("Saved locally, but couldn't sync to storage.");
    }

    setTimeout(() => setStampVisible(false), 1600);
    setExercises(emptyExercises(selectedDay));
  }

  function resetDay() {
    const fresh = emptyExercises(selectedDay);
    setExercises(fresh);
    persist(selectedDay, fresh);
  }

  const day = PROGRAM[selectedDay];

  return (
    <div
      className="min-h-screen w-full flex justify-center px-3 py-6"
      style={{
        background: COLORS.paperDark,
        fontFamily: "'IBM Plex Mono', monospace",
        color: COLORS.ink,
      }}
    >
      <style>{`
        .stencil { font-family: 'Bebas Neue', 'IBM Plex Mono', sans-serif; letter-spacing: 0.04em; }
        .ruled-row { border-bottom: 1px dashed ${COLORS.line}; }
        .stamp-enter {
          animation: stampSlam 0.45s cubic-bezier(.2,1.4,.4,1) forwards;
        }
        @keyframes stampSlam {
          0% { transform: scale(2.4) rotate(-18deg); opacity: 0; }
          60% { transform: scale(0.92) rotate(-8deg); opacity: 1; }
          100% { transform: scale(1) rotate(-8deg); opacity: 1; }
        }
        input[type=text]:focus, input[type=number]:focus { outline: 2px solid ${COLORS.olive}; outline-offset: 1px; }
        .checkbox-btn:focus-visible { outline: 2px solid ${COLORS.olive}; outline-offset: 2px; }
      `}</style>

      <div className="w-full max-w-md" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
        {/* Header / cover */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: `2px solid ${COLORS.ink}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell size={18} color={COLORS.olive} />
              <span className="text-xs tracking-widest" style={{ color: COLORS.inkFaint }}>
                {todayLabel()}
              </span>
            </div>
            {saving && <Loader2 size={14} className="animate-spin" color={COLORS.inkFaint} />}
          </div>
          <h1 className="stencil text-4xl leading-none mt-2" style={{ color: COLORS.ink }}>
            MACETA
          </h1>
          <p className="text-xs mt-1" style={{ color: COLORS.inkFaint }}>
            4-week full-body program · 3 sessions/week
          </p>
        </div>

        {/* Day tabs */}
        <div className="flex" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          {Object.entries(PROGRAM).map(([id, d], i, arr) => {
            const active = id === selectedDay;
            return (
              <button
                key={id}
                onClick={() => setSelectedDay(id)}
                className="flex-1 py-3 text-center"
                style={{
                  background: active ? COLORS.ink : "transparent",
                  color: active ? COLORS.paper : COLORS.inkFaint,
                  borderRight: i !== arr.length - 1 ? `1px solid ${COLORS.line}` : "none",
                }}
              >
                <div className="stencil text-lg leading-none">{d.label}</div>
                <div className="text-[10px] mt-0.5 tracking-wide">{d.title.toUpperCase()}</div>
              </button>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <div className="flex-1 h-2" style={{ background: COLORS.paperDark }}>
            <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: COLORS.olive }} />
          </div>
          <span className="text-xs tabular-nums" style={{ color: COLORS.inkFaint }}>
            {doneCount}/{totalCount} SETS
          </span>
        </div>

        {/* Exercises */}
        <div className="px-5 py-2 relative">
          {loading ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="animate-spin" size={20} color={COLORS.inkFaint} />
            </div>
          ) : (
            day.exercises.map((ex) => {
              const sets = exercises[ex.id] || emptySets(ex.sets);
              const exDone = sets.every((s) => s.done);
              return (
                <div key={ex.id} className="py-3 ruled-row">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                        {ex.name}
                      </div>
                      <div className="text-[11px]" style={{ color: COLORS.inkFaint }}>
                        {ex.note} · target {ex.reps}
                      </div>
                    </div>
                    {exDone && <Check size={16} color={COLORS.olive} />}
                  </div>

                  <div className="space-y-1.5">
                    {sets.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          className="checkbox-btn shrink-0 flex items-center justify-center"
                          aria-label={`Mark set ${idx + 1} of ${ex.name} done`}
                          onClick={() => toggleDone(ex.id, idx)}
                          style={{
                            width: 22,
                            height: 22,
                            border: `1.5px solid ${s.done ? COLORS.olive : COLORS.line}`,
                            background: s.done ? COLORS.olive : "transparent",
                          }}
                        >
                          {s.done && <Check size={14} color={COLORS.paper} />}
                        </button>
                        <span className="text-[11px] w-10" style={{ color: COLORS.inkFaint }}>
                          SET {idx + 1}
                        </span>
                        {!ex.timed ? (
                          <>
                            <input
                              type="number"
                              inputMode="decimal"
                              placeholder="lb"
                              value={s.weight}
                              onChange={(e) => updateSet(ex.id, idx, "weight", e.target.value)}
                              className="w-16 text-sm px-1.5 py-1 bg-transparent"
                              style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                            />
                            <input
                              type="number"
                              inputMode="numeric"
                              placeholder={ex.reps}
                              value={s.reps}
                              onChange={(e) => updateSet(ex.id, idx, "reps", e.target.value)}
                              className="w-16 text-sm px-1.5 py-1 bg-transparent"
                              style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                            />
                          </>
                        ) : (
                          <input
                            type="text"
                            placeholder={ex.reps}
                            value={s.reps}
                            onChange={(e) => updateSet(ex.id, idx, "reps", e.target.value)}
                            className="w-24 text-sm px-1.5 py-1 bg-transparent"
                            style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          {stampVisible && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="stamp-enter stencil px-6 py-2 text-3xl"
                style={{
                  color: COLORS.rust,
                  border: `4px double ${COLORS.rust}`,
                  transform: "rotate(-8deg)",
                  background: "rgba(237,232,220,0.9)",
                }}
              >
                COMPLETE
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-5 pb-2 text-[11px]" style={{ color: COLORS.rust }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: `1px solid ${COLORS.line}` }}>
          <button
            onClick={resetDay}
            className="flex items-center gap-1.5 text-xs px-3 py-2"
            style={{ color: COLORS.inkFaint, border: `1px solid ${COLORS.line}` }}
          >
            <RotateCcw size={12} /> RESET
          </button>
          <button
            onClick={completeWorkout}
            disabled={doneCount === 0}
            className="flex-1 stencil text-lg py-2.5 flex items-center justify-center gap-2"
            style={{
              background: doneCount === 0 ? COLORS.line : COLORS.olive,
              color: COLORS.paper,
              opacity: doneCount === 0 ? 0.6 : 1,
            }}
          >
            LOG WORKOUT <ChevronRight size={16} />
          </button>
        </div>

        {/* History */}
        <div className="px-5 pb-6 pt-2" style={{ borderTop: `2px solid ${COLORS.ink}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs tracking-widest" style={{ color: COLORS.inkFaint }}>
              LOGGED SESSIONS
            </div>
            {history.length > 0 && (
              <button
                onClick={() => downloadCSV(history)}
                className="flex items-center gap-1 text-[10px] px-2 py-1"
                style={{ color: COLORS.inkFaint, border: `1px solid ${COLORS.line}` }}
              >
                <Download size={10} /> CSV
              </button>
            )}
          </div>
          {history.length === 0 ? (
            <p className="text-xs italic" style={{ color: COLORS.inkFaint }}>
              Nothing logged yet. Finish a session to start your record.
            </p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 8).map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5 ruled-row">
                  <div>
                    <span className="stencil text-sm mr-2" style={{ color: COLORS.olive }}>
                      {h.dayLabel}
                    </span>
                    <span style={{ color: COLORS.inkFaint }}>
                      {new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div style={{ color: COLORS.ink }}>
                    {h.setsCompleted}/{h.totalSets} sets · {h.volume} lb vol
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
