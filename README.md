# Maceta

A mobile-first PWA workout tracker for a 4-week, 3-day/week full-body strength program. "Field log" / military logbook look — cream paper, olive/rust/ink palette, stencil headers, rubber-stamp "COMPLETE" animation on finishing a session.

Built with Vite + React + Tailwind, installable to your phone's home screen, works fully offline with no backend — all data lives in your browser's `localStorage` on your device.

## Features

- Multiple local profiles — anyone can add their name and log their own workouts on the same device, no login required (see below)
- Day I / II / III tabs, each with its own exercise list, sets, weight/reps inputs
- Progress bar + set-completion tracking per day
- In-progress session is saved automatically as you go (switch days without losing data)
- "Log Workout" saves a session to history with total volume, then resets the day
- Dedicated Progress view: overall volume trend plus a per-lift trend chart for every exercise, grouped by day
- History log of past sessions, exportable as CSV
- Installable as a PWA (Add to Home Screen on iPhone/Android), works offline
- Workout program lives in one editable data file — no component code changes needed to tweak exercises

## Profiles

The first time the app loads, it asks "Who's logging?" — enter a name to create your first profile. Tap the name chip in the top-right of the header to switch profiles or add another one (e.g. if a friend wants to use the same phone/tablet to log their own sessions). Each profile's active session and history are stored under their own key in `localStorage`, completely separate from other profiles on the same device.

This is local-only — there's no login and no sync between devices. Profiles are just a lightweight way to keep multiple people's logs from overwriting each other on one shared device. If you need real accounts people can log into from their own phones, see the note in "Data & privacy" below about swapping in a backend.

## Project structure

```
maceta/
├── index.html
├── vite.config.js          # PWA plugin config (manifest, service worker/offline caching)
├── tailwind.config.js
├── public/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── icons/               # PWA icons (192, 512, 512 maskable)
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx              # UI + logic (log view, profile switcher, view toggle)
    ├── data/
    │   └── program.js        # <-- Edit this to change exercises/sets/reps/days
    ├── components/
    │   ├── ProgressView.jsx  # Progress tab: trend charts + session history + CSV export
    │   └── TrendChart.jsx    # Small dependency-free SVG bar chart
    └── lib/
        ├── storage.js        # localStorage persistence layer
        └── profiles.js       # Local profile list + "current profile" helpers
```

## Editing your workout program

Open `src/data/program.js`. Each day is a key (`day1`, `day2`, `day3`, ...) with a `label`, `title`, and `exercises` array. Add, remove, or edit exercises there — no other file needs to change. Set `timed: true` on an exercise to get a text input (e.g. "30-45s") instead of weight/reps number fields.

## Local development

Requires [Node.js](https://nodejs.org/) 18+.

```bash
npm install
npm run dev
```

Open the printed local URL in your browser.

```bash
npm run build      # production build -> dist/
npm run preview    # preview the production build locally
```

## Push to GitHub

This project's GitHub repo is currently named `Lechu-Lifts` (from before the app was renamed to Maceta). The app's on-screen branding, package name, and PWA manifest all say "Maceta" now, but the repo name itself hasn't changed — that's a manual rename on GitHub.com if you want it (see note below).

From inside the project folder:

```bash
git init
git add .
git commit -m "Rename app to Maceta"
git branch -M main
git remote add origin https://github.com/<your-username>/Lechu-Lifts.git
git push -u origin main
```

(If you're continuing in the same repo you already pushed to, skip `git init`/`remote add` — just commit and push as usual via GitHub Desktop.)

**If you also want to rename the GitHub repo to `Maceta`:** go to the repo → Settings → General → Repository name → rename it. Then update `BASE` in `vite.config.js` from `"/Lechu-Lifts/"` to `"/Maceta/"` (or whatever the new repo name is) so GitHub Pages asset paths still resolve correctly.

## Deploy (so you can open it on your phone)

### Option A: GitHub Pages (no third-party account needed)

This repo already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the app and publishes it to Pages automatically on every push to `main`.

1. Push the repo to GitHub (see above).
2. On GitHub.com, go to your repo → **Settings → Pages**.
3. Under **Build and deployment → Source**, change it from "Deploy from a branch" to **"GitHub Actions"**.
4. Push a commit (or go to the **Actions** tab and re-run the "Deploy to GitHub Pages" workflow). Once it finishes, your site is live at:
   `https://<your-username>.github.io/Lechu-Lifts/` (or `/Maceta/` if you renamed the repo — see below)
5. Every future `git push` to `main` re-deploys automatically.

Note: `vite.config.js` has `base: "/Lechu-Lifts/"` hardcoded, matching this repo's current name so assets resolve correctly under the Pages subpath. If you rename the GitHub repo, update `BASE` in `vite.config.js` to match.

### Option B: Vercel / Netlify (if you'd rather use one of those)

1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com), sign in with GitHub.
2. Import your repo — framework auto-detects as Vite, build command `npm run build`, output directory `dist`.
3. Deploy. You'll get a URL like `maceta.vercel.app`.

## Add to Home Screen (iPhone)

1. Open your deployed URL in **Safari** on your iPhone.
2. Tap the Share icon → **Add to Home Screen**.
3. Launch it from the home screen icon — it opens full-screen like a native app and works offline for logging (data syncs to history once you're back online, though since storage is local-only, offline logging always works regardless of connection).

## Google Sheets sync (optional)

Every logged workout can be appended to a Google Sheet. It's one-way (app → Sheet), uses a small Google Apps Script web app, and needs no Google Cloud project.

1. Create a blank Google Sheet. Open **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with `google-apps-script/Code.gs` from this repo, and change `TOKEN` to a long random string.
3. **Deploy → New deployment → Web app.** Execute as: **Me**. Who has access: **Anyone**. Deploy, authorize when prompted, and copy the URL ending in `/exec`.
4. In Maceta, open **Progress → Google Sheets Sync**, paste the URL and the same token, and tap **Sync all history** (backfills what you've already logged). New workouts then sync automatically on **Log Workout**; if you're offline they queue and retry.

If you edit the script later, redeploy via **Deploy → Manage deployments → Edit → New version**.

Columns (tabs and headers are created automatically):

- **Sessions:** `session_id, logged_at, date, profile, day, day_title, sets_completed, total_sets, total_volume_lb`
- **Sets:** `session_id, logged_at, date, profile, day, exercise_id, exercise, set_number, weight_lb, reps, volume_lb`

The URL and token live in your phone's localStorage, not in the repo. Anyone with both could write to your Sheet, so don't share them.

## Data & privacy

Everything is stored locally in your phone's browser (`localStorage`) — nothing leaves your device, no account needed. This also means: clearing Safari's site data for this app, or switching phones, will reset your history. If you want cross-device sync later, swap out `src/lib/storage.js` for a Supabase- or Firebase-backed version; `App.jsx` doesn't need to change since it only calls `storage.get/set/delete`.
