// Google Sheets sync (one-way: app -> Sheet) via a Google Apps Script web app.
//
// - The web app URL + shared token are stored on this device only (never in
//   the repo), configured from the Progress tab.
// - Each logged workout is queued locally, then POSTed to the script. If the
//   phone is offline or Google is unreachable the item stays queued and is
//   retried on the next app open / when the device comes back online.
// - The script de-duplicates on session_id, so retries never create dupes.

import { storage } from "./storage.js";

const CONFIG_KEY = "sheets-config";
const QUEUE_KEY = "sheets-queue";

export async function getSheetsConfig() {
  const res = await storage.get(CONFIG_KEY);
  return res ? JSON.parse(res.value) : { url: "", token: "" };
}

export async function saveSheetsConfig(cfg) {
  await storage.set(CONFIG_KEY, JSON.stringify(cfg));
}

export function isConfigured(cfg) {
  return Boolean(cfg && cfg.url && cfg.token);
}

async function readQueue() {
  const res = await storage.get(QUEUE_KEY);
  return res ? JSON.parse(res.value) : [];
}

async function writeQueue(q) {
  await storage.set(QUEUE_KEY, JSON.stringify(q));
}

export async function queueCount() {
  return (await readQueue()).length;
}

function localDate(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// Turns a local history entry into the { session, sets } rows the script expects.
export function buildPayload(profileName, entry) {
  const common = {
    session_id: entry.id,
    logged_at: entry.date,
    date: localDate(entry.date),
    profile: profileName,
    day: entry.dayLabel,
  };
  const session = {
    ...common,
    day_title: entry.dayTitle,
    sets_completed: entry.setsCompleted,
    total_sets: entry.totalSets,
    total_volume_lb: entry.volume,
  };
  const sets = (entry.sets || []).map((s) => ({
    ...common,
    exercise_id: s.exerciseId,
    exercise: s.exercise,
    set_number: s.setNumber,
    weight_lb: s.weight,
    reps: s.reps,
    volume_lb: s.volume,
  }));
  return { session, sets };
}

export async function enqueue(payload) {
  const q = await readQueue();
  if (!q.some((p) => p.session.session_id === payload.session.session_id)) {
    q.push(payload);
    await writeQueue(q);
  }
}

// Queue every session in a profile's history (for the one-time backfill).
// Sessions logged before sync existed have no id/set detail, so they get a
// stable legacy id and go up as session rows only.
export async function enqueueHistory(profile, history) {
  for (const h of history) {
    const entry = h.id ? h : { ...h, id: `legacy-${profile.id}-${h.date}` };
    await enqueue(buildPayload(profile.name, entry));
  }
  return history.length;
}

let flushing = null;

export function flushQueue() {
  if (!flushing) {
    flushing = doFlush().finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function doFlush() {
  const cfg = await getSheetsConfig();
  let q = await readQueue();
  if (!isConfigured(cfg)) return { sent: 0, remaining: q.length, error: "not-configured" };

  let sent = 0;
  let error = null;
  while (q.length) {
    const item = q[0];
    try {
      // text/plain keeps this a "simple" request, so the browser skips the
      // CORS preflight that Apps Script web apps can't answer.
      const res = await fetch(cfg.url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ token: cfg.token, session: item.session, sets: item.sets }),
      });
      const data = await res.json();
      if (!data.ok) {
        error = data.error || "rejected";
        break;
      }
      q = q.slice(1);
      sent += 1;
      await writeQueue(q);
    } catch {
      error = "network";
      break;
    }
  }
  return { sent, remaining: q.length, error };
}
