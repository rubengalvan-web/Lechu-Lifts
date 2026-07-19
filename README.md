# Lechu Lifts

A mobile-first PWA workout tracker for a 4-week, 3-day/week full-body strength program. "Field log" / military logbook look — cream paper, olive/rust/ink palette, stencil headers, rubber-stamp "COMPLETE" animation on finishing a session.

Built with Vite + React + Tailwind, installable to your phone's home screen, works fully offline with no backend — all data lives in your browser's `localStorage` on your device.

## Features

- Day I / II / III tabs, each with its own exercise list, sets, weight/reps inputs
- Progress bar + set-completion tracking per day
- In-progress session is saved automatically as you go (switch days without losing data)
- "Log Workout" saves a session to history with total volume, then resets the day
- History log of past sessions, exportable as CSV
- Installable as a PWA (Add to Home Screen on iPhone/Android), works offline
- Workout program lives in one editable data file — no component code changes needed to tweak exercises

## Project structure

```
lechu-lifts/
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
    ├── App.jsx              # UI + logic (port of the original prototype)
    ├── data/
    │   └── program.js        # <-- Edit this to change exercises/sets/reps/days
    └── lib/
        └── storage.js        # localStorage persistence layer
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

From inside the `lechu-lifts` folder:

```bash
git init
git add .
git commit -m "Initial commit: Lechu Lifts"
git branch -M main
git remote add origin https://github.com/<your-username>/lechu-lifts.git
git push -u origin main
```

(Create the empty `lechu-lifts` repo on GitHub first, without a README/gitignore, then run the above.)

## Deploy (so you can open it on your phone)

### Option A: GitHub Pages (no third-party account needed)

This repo already includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds the app and publishes it to Pages automatically on every push to `main`.

1. Push the repo to GitHub (see above).
2. On GitHub.com, go to your repo → **Settings → Pages**.
3. Under **Build and deployment → Source**, change it from "Deploy from a branch" to **"GitHub Actions"**.
4. Push a commit (or go to the **Actions** tab and re-run the "Deploy to GitHub Pages" workflow). Once it finishes, your site is live at:
   `https://<your-username>.github.io/Lechu-Lifts/`
5. Every future `git push` to `main` re-deploys automatically.

Note: `vite.config.js` has `base: "/Lechu-Lifts/"` hardcoded, matching this repo's name so assets resolve correctly under the Pages subpath. If you rename the GitHub repo, update `BASE` in `vite.config.js` to match.

### Option B: Vercel / Netlify (if you'd rather use one of those)

1. Go to [vercel.com](https://vercel.com) or [netlify.com](https://netlify.com), sign in with GitHub.
2. Import your `Lechu-Lifts` repo — framework auto-detects as Vite, build command `npm run build`, output directory `dist`.
3. Deploy. You'll get a URL like `lechu-lifts.vercel.app`.

## Add to Home Screen (iPhone)

1. Open your deployed URL in **Safari** on your iPhone.
2. Tap the Share icon → **Add to Home Screen**.
3. Launch it from the home screen icon — it opens full-screen like a native app and works offline for logging (data syncs to history once you're back online, though since storage is local-only, offline logging always works regardless of connection).

## Data & privacy

Everything is stored locally in your phone's browser (`localStorage`) — nothing leaves your device, no account needed. This also means: clearing Safari's site data for this app, or switching phones, will reset your history. If you want cross-device sync later, swap out `src/lib/storage.js` for a Supabase- or Firebase-backed version; `App.jsx` doesn't need to change since it only calls `storage.get/set/delete`.
