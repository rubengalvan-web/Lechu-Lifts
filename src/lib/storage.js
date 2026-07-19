// localStorage-backed persistence layer.
//
// Mirrors the async get/set/delete shape the original Claude-artifact
// prototype used (window.storage), so it's a drop-in replacement — but
// backed by real browser localStorage, which persists across app closes/
// reopens on the same device with no login or backend required.
//
// If you ever want to sync across devices later, this is the seam to swap
// out for a Supabase/Firebase-backed implementation without touching
// App.jsx.

const PREFIX = "maceta:";

function read(key) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? null : raw;
  } catch {
    return null;
  }
}

function write(key, value) {
  window.localStorage.setItem(PREFIX + key, value);
}

function remove(key) {
  window.localStorage.removeItem(PREFIX + key);
}

export const storage = {
  async get(key) {
    const value = read(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    write(key, value);
    return true;
  },
  async delete(key) {
    remove(key);
    return true;
  },
};
