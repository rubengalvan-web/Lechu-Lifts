// Workout program data — edit this file to change exercises, sets, reps, etc.
// without touching any component/app logic.
//
// Each day is keyed (day1, day2, day3, ...) and rendered as a tab in that order.
// Exercises are listed in the order you do them.
//
// Optional exercise fields:
//   timed: true       -> text input for time (e.g. "40s") instead of weight/reps
//   repsOnly: true    -> reps input only, no weight (bands, bodyweight)
//   tags: ["vmo"]     -> VMO badge; startup check warns if the plan has none
//   superset: "A1"    -> shown as "(Superset A1)" in the title. Partners share
//                        the letter and sit next to each other in the list.
//   filler: "..."     -> done during another lift's rest, e.g. "between bench sets"
//   short: false      -> hidden in Short mode
//   shortSets: 2      -> number of sets in Short mode
//
// Day-level `cooldown` is shown as a note after the last exercise.

const CHEST_COOLDOWN = "Doorway pec stretch 2×30s per side · Foam-roller thoracic extension 60s";

export const PROGRAM = {
  day1: {
    label: "DAY I",
    title: "Squat Focus",
    cooldown: CHEST_COOLDOWN,
    exercises: [
      {
        id: "sq_tke",
        name: "Terminal Knee Extensions (band)",
        sets: 2,
        reps: "15",
        note: "VMO + knee stability · band on a rack post",
        tags: ["vmo"],
        filler: "between squat warm-up sets",
      },
      { id: "sq_back-squat", name: "Back Squat (or Goblet Squat)", sets: 3, reps: "8–10", note: "Main lift · straight sets" },
      { id: "sq_bench", name: "Flat Bench Press (or Push-ups)", sets: 3, reps: "8–12", note: "Main lift · straight sets" },
      {
        id: "sq_pullapart",
        name: "Band Pull-Aparts",
        sets: 3,
        reps: "15",
        note: "Upper back / rear delts",
        repsOnly: true,
        filler: "between bench sets",
      },
      { id: "sq_row", name: "Dumbbell Bent-Over Row", sets: 3, reps: "8–12", note: "Horizontal pull", superset: "A1" },
      {
        id: "sq_ohp",
        name: "Standing Overhead Press (barbell or DB)",
        sets: 3,
        reps: "8–10",
        note: "Vertical push · front delts",
        superset: "A2",
      },
      {
        id: "sq_latpulldown",
        name: "Lat Pulldown (or Pull-ups)",
        sets: 3,
        reps: "8–12",
        note: "Vertical pull — lat width",
        superset: "B1",
        short: false,
      },
      {
        id: "sq_plank",
        name: "Plank",
        sets: 3,
        reps: "30–45s",
        note: "Core bracing · on the floor by the machine",
        timed: true,
        superset: "B2",
        short: false,
      },
    ],
  },
  day2: {
    label: "DAY II",
    title: "Hinge + Back",
    cooldown: CHEST_COOLDOWN,
    exercises: [
      { id: "hg_rdl", name: "Romanian Deadlift", sets: 3, reps: "8–10", note: "Main lift · straight sets" },
      {
        id: "hg_neutralpull",
        name: "Neutral-Grip Pulldown (or Chin-ups)",
        sets: 3,
        reps: "8–12",
        note: "Back first today · vertical pull",
      },
      { id: "hg_row", name: "Single-Arm Dumbbell Row", sets: 3, reps: "8–12/side", note: "Horizontal pull — back thickness" },
      {
        id: "hg_incline",
        name: "Incline Dumbbell Press",
        sets: 3,
        reps: "8–12",
        note: "Chest · straight sets",
        shortSets: 2,
      },
      {
        id: "hg_reardelt",
        name: "Reverse Fly (dumbbell)",
        sets: 3,
        reps: "12–15",
        note: "Rear delts / upper back · by the rack",
        superset: "A1",
      },
      {
        id: "hg_spanish",
        name: "Spanish Squat (band hold)",
        sets: 3,
        reps: "30–45s",
        note: "Isometric · VMO + knee stability",
        timed: true,
        tags: ["vmo"],
        superset: "A2",
      },
      {
        id: "hg_pallof",
        name: "Pallof Press (band)",
        sets: 3,
        reps: "10/side",
        note: "Anti-rotation core · band on the rack",
        superset: "A3",
        short: false,
      },
    ],
  },
  day3: {
    label: "DAY III",
    title: "Full-Body Power",
    cooldown: CHEST_COOLDOWN,
    exercises: [
      { id: "pw_deadlift", name: "Trap Bar / Conventional Deadlift", sets: 3, reps: "6–8", note: "Main lift · straight sets" },
      { id: "pw_cablerow", name: "Seated Cable Row", sets: 3, reps: "8–12", note: "Main pull · straight sets" },
      {
        id: "pw_stepup",
        name: "Step-ups (weighted)",
        sets: 3,
        reps: "10/leg",
        note: "VMO — lock out at the top",
        tags: ["vmo"],
        superset: "A1",
      },
      {
        id: "pw_deadbug",
        name: "Dead Bug / Hanging Knee Raise",
        sets: 3,
        reps: "10–12",
        note: "Anti-extension core · floor by the box",
        superset: "A2",
        short: false,
      },
      { id: "pw_facepull", name: "Face Pulls", sets: 3, reps: "12–15", note: "Rear delts / upper back", superset: "B1" },
      {
        id: "pw_latraise",
        name: "Lateral Raise",
        sets: 3,
        reps: "12–15",
        note: "Side delts · bring DBs to the cable",
        superset: "B2",
      },
    ],
  },
};

// Exercises for a day in the given mode ("full" | "short"), with Short-mode
// set counts applied.
export function exercisesFor(dayId, mode) {
  return PROGRAM[dayId].exercises
    .filter((ex) => mode !== "short" || ex.short !== false)
    .map((ex) => (mode === "short" && ex.shortSets ? { ...ex, sets: ex.shortSets } : ex));
}

// Title suffix: "(Superset A1)" only when a partner is also showing, or the
// filler instruction. Exercises listed in the same mode are passed in.
export function titleSuffix(ex, visible) {
  if (ex.superset) {
    const letter = ex.superset[0];
    const partners = visible.filter((e) => e.superset && e.superset[0] === letter).length;
    if (partners > 1) return `(Superset ${ex.superset})`;
  }
  if (ex.filler) return `(${ex.filler})`;
  return "";
}

// Startup check: the plan should always include at least one VMO exercise.
const hasVmo = Object.values(PROGRAM).some((d) => d.exercises.some((e) => e.tags && e.tags.includes("vmo")));
if (!hasVmo && typeof console !== "undefined") {
  console.warn("Maceta: no exercise in program.js is tagged 'vmo' — add at least one VMO-focused exercise.");
}

export const COLORS = {
  paper: "#EDE8DC",
  paperDark: "#E0D9C6",
  ink: "#26271F",
  inkFaint: "#6B6B5C",
  olive: "#57603E",
  oliveDark: "#3E4530",
  rust: "#A6432E",
  steel: "#4A5A63",
  line: "#C9C0A8",
};
