// Local, no-login profile management. Each profile is just a name + id;
// all of a profile's session/history data is namespaced under that id in
// localStorage (see `scopedKey` in App.jsx). No accounts, no backend —
// switching profiles just switches which slice of localStorage the app reads.

import { storage } from "./storage.js";

const PROFILES_KEY = "profiles";
const CURRENT_KEY = "current-profile";

export function makeProfileId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listProfiles() {
  const res = await storage.get(PROFILES_KEY);
  return res ? JSON.parse(res.value) : [];
}

export async function saveProfiles(profiles) {
  await storage.set(PROFILES_KEY, JSON.stringify(profiles));
}

export async function getCurrentProfileId() {
  const res = await storage.get(CURRENT_KEY);
  return res ? res.value : null;
}

export async function setCurrentProfileId(id) {
  await storage.set(CURRENT_KEY, id);
}
