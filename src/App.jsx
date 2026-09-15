import React, { useState, useEffect, useCallback } from "react";
import { Check, Dumbbell, ChevronRight, RotateCcw, Loader2, ChevronDown, Plus, Trash2 } from "lucide-react";
import { PROGRAM, COLORS } from "./data/program.js";
import { storage } from "./lib/storage.js";
import { listProfiles, saveProfiles, getCurrentProfileId, setCurrentProfileId, makeProfileId } from "./lib/profiles.js";
import ProgressView from "./components/ProgressView.jsx";

// All per-profile data (active sessions, history) lives under a key scoped
// to that profile's id, so switching profiles switches which slice of
// localStorage the app reads/writes without touching anyone else's data.
function scopedKey(profileId, key) {
  return `p:${profileId}:${key}`;
}

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

// Keeps whatever weight/reps were last typed in, just unchecks the "done"
// boxes — so next time this day comes up, last session's numbers are still
// sitting there as a reminder instead of blank fields.
function carryOverValues(exercisesObj, dayId) {
  const base = emptyExercises(dayId);
  const out = {};
  Object.keys(base).forEach((exId) => {
    const savedSets = exercisesObj[exId];
    out[exId] = savedSets ? savedSets.map((s) => ({ ...s, done: false })) : base[exId];
  });
  return out;
}

// Defensive merge for exercises the program picked up after a session was
// already saved (e.g. a new exercise added to program.js) — fills in empty
// defaults for anything missing from the stored session.
function mergeWithDefaults(stored, dayId) {
  const base = emptyExercises(dayId);
  if (!stored) return base;
  return { ...base, ...stored };
}

function todayLabel() {
  const d = new Date();
  return d
    .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export default function App() {
  // --- Profiles ---
  const [profiles, setProfiles] = useState([]);
  const [currentProfileId, setCurrentProfileIdState] = useState(null);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");

  // --- View / logging state ---
  const [view, setView] = useState("log"); // "log" | "progress"
  const [selectedDay, setSelectedDay] = useState("day1");
  const [exercises, setExercises] = useState(() => emptyExercises("day1"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [stampVisible, setStampVisible] = useState(false);
  const [error, setError] = useState(null);

  const currentProfile = profiles.find((p) => p.id === currentProfileId) || null;

  // Load profile list + whichever profile was last active, once on mount.
  useEffect(() => {
    (async () => {
      const list = await listProfiles();
      const curId = await getCurrentProfileId();
      setProfiles(list);
      if (list.length > 0) {
        const stillExists = list.some((p) => p.id === curId);
        const resolved = stillExists ? curId : list[0].id;
        setCurrentProfileIdState(resolved);
        if (!stillExists) await setCurrentProfileId(resolved);
      }
      setProfilesLoading(false);
    })();
  }, []);

  async function createProfile(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = makeProfileId();
    const next = [...profiles, { id, name: trimmed }];
    setProfiles(next);
    await saveProfiles(next);
    await setCurrentProfileId(id);
    setCurrentProfileIdState(id);
    setNewProfileName("");
    setProfileMenuOpen(false);
    setSelectedDay("day1");
    setView("log");
  }

  async function switchProfile(id) {
    if (id === currentProfileId) {
      setProfileMenuOpen(false);
      return;
    }
    setCurrentProfileIdState(id);
    await setCurrentProfileId(id);
    setProfileMenuOpen(false);
    setSelectedDay("day1");
    setView("log");
  }

  async function deleteProfile(id) {
    if (profiles.length <= 1) return; // always keep at least one profile
    const next = profiles.filter((p) => p.id !== id);
    setProfiles(next);
    await saveProfiles(next);
    await storage.delete(scopedKey(id, "history"));
    for (const dayId of Object.keys(PROGRAM)) {
      await storage.delete(scopedKey(id, `active-session:${dayId}`));
    }
    if (currentProfileId === id) {
      const fallback = next[0].id;
      setCurrentProfileIdState(fallback);
      await setCurrentProfileId(fallback);
    }
  }

  // Load this profile's history once we know who's active.
  useEffect(() => {
    if (!currentProfileId) return;
    (async () => {
      try {
        const res = await storage.get(scopedKey(currentProfileId, "history"));
        setHistory(res ? JSON.parse(res.value) : []);
      } catch {
        setHistory([]);
      }
    })();
  }, [currentProfileId]);

  // Load active session whenever day or profile changes.
  useEffect(() => {
    if (!currentProfileId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await storage.get(scopedKey(currentProfileId, `active-session:${selectedDay}`));
        if (!cancelled) {
          setExercises(mergeWithDefaults(res ? JSON.parse(res.value) : null, selectedDay));
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
  }, [selectedDay, currentProfileId]);

  const persist = useCallback(
    async (dayId, data) => {
      if (!currentProfileId) return;
      setSaving(true);
      try {
        await storage.set(scopedKey(currentProfileId, `active-session:${dayId}`), JSON.stringify(data));
      } catch {
        setError("Couldn't save — check your browser storage.");
      } finally {
        setSaving(false);
      }
    },
    [currentProfileId]
  );

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
    const day = PROGRAM[selectedDay];

    // Per-exercise breakdown so the Progress view can chart trends per lift,
    // not just a single total-volume number for the whole session.
    const exerciseBreakdown = day.exercises.map((ex) => {
      const sets = exercises[ex.id] || [];
      const completed = sets.filter((s) => s.done);
      const volume = completed.reduce((sum, s) => {
        const w = parseFloat(s.weight) || 0;
        const r = parseFloat(s.reps) || 0;
        return sum + w * r;
      }, 0);
      const topWeight = completed.reduce((max, s) => Math.max(max, parseFloat(s.weight) || 0), 0);
      return {
        id: ex.id,
        name: ex.name,
        setsCompleted: completed.length,
        volume: Math.round(volume),
        topWeight,
      };
    });

    const volume = exerciseBreakdown.reduce((sum, e) => sum + e.volume, 0);

    const summary = {
      date: new Date().toISOString(),
      dayId: selectedDay,
      dayLabel: day.label,
      dayTitle: day.title,
      setsCompleted: doneCount,
      totalSets: totalCount,
      volume: Math.round(volume),
      exercises: exerciseBreakdown,
    };

    const nextHistory = [summary, ...history].slice(0, 200);
    setHistory(nextHistory);
    setStampVisible(true);

    // Carry weight/reps forward into the next session for this day (just
    // clear the checkmarks) instead of wiping the fields blank, so the
    // numbers from today are still there next time as a reminder.
    const carried = carryOverValues(exercises, selectedDay);
    setExercises(carried);

    try {
      await storage.set(scopedKey(currentProfileId, "history"), JSON.stringify(nextHistory));
      await storage.set(scopedKey(currentProfileId, `active-session:${selectedDay}`), JSON.stringify(carried));
    } catch {
      setError("Saved locally, but couldn't sync to storage.");
    }

    setTimeout(() => setStampVisible(false), 1600);
  }

  function resetDay() {
    const fresh = emptyExercises(selectedDay);
    setExercises(fresh);
    persist(selectedDay, fresh);
  }

  const day = PROGRAM[selectedDay];

  const sharedStyle = `
    .stencil { font-family: 'Bebas Neue', 'IBM Plex Mono', sans-serif; letter-spacing: 0.04em; }
    .ruled-row { border-bottom: 1px dashed ${COLORS.line}; }
    .stamp-enter { animation: stampSlam 0.45s cubic-bezier(.2,1.4,.4,1) forwards; }
    @keyframes stampSlam {
      0% { transform: scale(2.4) rotate(-18deg); opacity: 0; }
      60% { transform: scale(0.92) rotate(-8deg); opacity: 1; }
      100% { transform: scale(1) rotate(-8deg); opacity: 1; }
    }
    input[type=text]:focus, input[type=number]:focus { outline: 2px solid ${COLORS.olive}; outline-offset: 1px; }
    .checkbox-btn:focus-visible { outline: 2px solid ${COLORS.olive}; outline-offset: 2px; }
  `;

  // --- Onboarding: no profiles yet, ask who's logging ---
  if (!profilesLoading && profiles.length === 0) {
    return (
      <div
        className="min-h-screen w-full flex justify-center items-center px-3 py-6"
        style={{ background: COLORS.paperDark, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.ink }}
      >
        <style>{sharedStyle}</style>
        <div className="w-full max-w-md p-6" style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}>
          <h1 className="stencil text-4xl mb-1">MACETA</h1>
          <p className="text-xs mb-4" style={{ color: COLORS.inkFaint }}>
            Who's logging?
          </p>
          <input
            type="text"
            placeholder="Your name"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createProfile(newProfileName)}
            className="w-full text-sm px-3 py-2 mb-3 bg-transparent"
            style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
            autoFocus
          />
          <button
            onClick={() => createProfile(newProfileName)}
            className="w-full stencil text-lg py-2.5"
            style={{ background: COLORS.olive, color: COLORS.paper }}
          >
            START LOGGING
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex justify-center px-3 py-6"
      style={{
        background: COLORS.paperDark,
        fontFamily: "'IBM Plex Mono', monospace",
        color: COLORS.ink,
      }}
    >
      <style>{sharedStyle}</style>

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
            <div className="flex items-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" color={COLORS.inkFaint} />}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="flex items-center gap-1 text-xs px-2 py-1"
                  style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                >
                  {currentProfile?.name || "…"} <ChevronDown size={12} />
                </button>
                {profileMenuOpen && (
                  <div
                    className="absolute right-0 mt-1 w-52 z-10"
                    style={{ background: COLORS.paper, border: `1px solid ${COLORS.line}` }}
                  >
                    {profiles.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs"
                        style={{
                          background: p.id === currentProfileId ? COLORS.paperDark : "transparent",
                          borderBottom: `1px dashed ${COLORS.line}`,
                        }}
                      >
                        <button
                          onClick={() => switchProfile(p.id)}
                          className="flex-1 text-left px-3 py-2 flex items-center gap-1.5"
                          style={{ color: COLORS.ink }}
                        >
                          {p.id === currentProfileId && <Check size={11} color={COLORS.olive} />}
                          {p.name}
                        </button>
                        {profiles.length > 1 && (
                          <button
                            onClick={() => deleteProfile(p.id)}
                            className="px-2 py-2"
                            aria-label={`Delete profile ${p.name}`}
                            style={{ color: COLORS.rust }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="px-2 py-2 flex gap-1">
                      <input
                        type="text"
                        placeholder="New profile"
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && createProfile(newProfileName)}
                        className="flex-1 text-xs px-2 py-1 bg-transparent min-w-0"
                        style={{ border: `1px solid ${COLORS.line}`, color: COLORS.ink }}
                      />
                      <button
                        onClick={() => createProfile(newProfileName)}
                        className="text-xs px-2 shrink-0"
                        aria-label="Add profile"
                        style={{ border: `1px solid ${COLORS.line}`, color: COLORS.olive }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <h1 className="stencil text-4xl leading-none mt-2" style={{ color: COLORS.ink }}>
            MACETA
          </h1>
          <p className="text-xs mt-1" style={{ color: COLORS.inkFaint }}>
            4-week full-body program · 3 sessions/week
          </p>
        </div>

        {/* Log / Progress toggle */}
        <div className="flex" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
          <button
            onClick={() => setView("log")}
            className="flex-1 py-2 stencil text-base tracking-wide"
            style={{
              background: view === "log" ? COLORS.ink : "transparent",
              color: view === "log" ? COLORS.paper : COLORS.inkFaint,
              borderRight: `1px solid ${COLORS.line}`,
            }}
          >
            LOG
          </button>
          <button
            onClick={() => setView("progress")}
            className="flex-1 py-2 stencil text-base tracking-wide"
            style={{
              background: view === "progress" ? COLORS.ink : "transparent",
              color: view === "progress" ? COLORS.paper : COLORS.inkFaint,
            }}
          >
            PROGRESS
          </button>
        </div>

        {view === "progress" ? (
          <ProgressView history={history} program={PROGRAM} colors={COLORS} />
        ) : (
          <>
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
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: COLORS.olive }}
                />
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
          </>
        )}
      </div>
    </div>
  );
}
