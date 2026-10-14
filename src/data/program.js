// Workout program data — edit this file to change exercises, sets, reps, etc.
// without touching any component/app logic.
//
// Each day is keyed (day1, day2, day3, ...) and rendered as a tab in that order.
// Set `timed: true` on an exercise to render a text input (e.g. "30-45s")
// instead of separate weight/reps number inputs.
// Add `tags: ["vmo"]` to mark VMO-focused work (shows a VMO badge, and the
// startup check below warns if the program ever ends up with none).

export const PROGRAM = {
  day1: {
    label: "DAY I",
    title: "Squat Focus",
    exercises: [
      {
        id: "sq_tke",
        name: "Terminal Knee Extensions (band)",
        sets: 2,
        reps: "15",
        note: "Activation before squats · VMO + knee stability",
        tags: ["vmo"],
      },
      { id: "sq_back-squat", name: "Back Squat (or Goblet Squat)", sets: 3, reps: "8–10", note: "Compound lower body lift" },
      { id: "sq_bench", name: "Flat Bench Press (or Push-ups)", sets: 3, reps: "8–12", note: "Horizontal push" },
      { id: "sq_row", name: "Bent-Over Row", sets: 3, reps: "8–12", note: "Horizontal pull" },
      { id: "sq_latpulldown", name: "Lat Pulldown (or Pull-ups)", sets: 3, reps: "8–12", note: "Vertical pull — extra back volume" },
      { id: "sq_ohp", name: "Standing Overhead Press", sets: 3, reps: "8–10", note: "Vertical push · front delts" },
      { id: "sq_plank", name: "Plank", sets: 3, reps: "30–45s", note: "Core bracing", timed: true },
    ],
  },
  day2: {
    label: "DAY II",
    title: "Hinge Focus",
    exercises: [
      { id: "hg_rdl", name: "Romanian Deadlift", sets: 3, reps: "8–10", note: "Posterior chain — back health" },
      { id: "hg_incline", name: "Incline Dumbbell Press", sets: 3, reps: "8–12", note: "Horizontal push variation" },
      { id: "hg_neutralpull", name: "Neutral-Grip Pulldown (or Chin-ups)", sets: 3, reps: "8–12", note: "Vertical pull — different grip than Day I" },
      { id: "hg_row", name: "Single-Arm Dumbbell Row", sets: 3, reps: "8–12/side", note: "Horizontal pull — extra back volume" },
      { id: "hg_reardelt", name: "Reverse Fly (dumbbell or cable)", sets: 3, reps: "12–15", note: "Rear delts / upper back" },
      {
        id: "hg_spanish",
        name: "Spanish Squat (band hold)",
        sets: 3,
        reps: "30–45s",
        note: "Isometric · VMO + knee stability",
        timed: true,
        tags: ["vmo"],
      },
      { id: "hg_pallof", name: "Pallof Press", sets: 3, reps: "10/side", note: "Anti-rotation core" },
    ],
  },
  day3: {
    label: "DAY III",
    title: "Full-Body Power",
    exercises: [
      { id: "pw_deadlift", name: "Trap Bar / Conventional Deadlift", sets: 3, reps: "6–8", note: "Heaviest lift of the week" },
      { id: "pw_cablerow", name: "Seated Cable Row", sets: 3, reps: "8–12", note: "Horizontal pull" },
      { id: "pw_facepull", name: "Face Pulls", sets: 3, reps: "12–15", note: "Rear delts / upper back" },
      { id: "pw_latraise", name: "Lateral Raise", sets: 3, reps: "12–15", note: "Side delts" },
      {
        id: "pw_stepup",
        name: "Step-ups (weighted)",
        sets: 3,
        reps: "10/leg",
        note: "Functional leg strength · VMO (lock out at the top)",
        tags: ["vmo"],
      },
      { id: "pw_deadbug", name: "Dead Bug / Hanging Knee Raise", sets: 3, reps: "10–12", note: "Anti-extension core" },
    ],
  },
};

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
