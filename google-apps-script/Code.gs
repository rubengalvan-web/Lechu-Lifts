/**
 * Maceta -> Google Sheets receiver.
 *
 * Paste this into Extensions > Apps Script on your Google Sheet, change TOKEN,
 * then Deploy > New deployment > Web app (Execute as: Me, Access: Anyone).
 *
 * The "Sessions" and "Sets" tabs (and their header rows) are created
 * automatically on the first workout, so you can start from a blank Sheet.
 * Re-sent sessions are ignored (de-duplicated on session_id).
 */

// Change this to a long random string, and paste the same value into the
// Maceta app (Progress tab > Google Sheets Sync).
const TOKEN = "CHANGE-ME-to-a-long-random-string";

const SESSION_COLS = [
  "session_id",
  "logged_at",
  "date",
  "profile",
  "day",
  "day_title",
  "sets_completed",
  "total_sets",
  "total_volume_lb",
];

const SET_COLS = [
  "session_id",
  "logged_at",
  "date",
  "profile",
  "day",
  "exercise_id",
  "exercise",
  "set_number",
  "weight_lb",
  "reps",
  "volume_lb",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return reply({ ok: false, error: "unauthorized" });

    const s = body.session;
    if (!s || !s.session_id) return reply({ ok: false, error: "missing session" });

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sessions = getTab(ss, "Sessions", SESSION_COLS);
    const sets = getTab(ss, "Sets", SET_COLS);

    if (sessionExists(sessions, s.session_id)) {
      return reply({ ok: true, duplicate: true });
    }

    // Write the set rows first, then the session row, so a session only shows
    // up in "Sessions" once all of its sets are safely in.
    const rows = (body.sets || []).map((r) => SET_COLS.map((c) => (r[c] === undefined ? "" : r[c])));
    if (rows.length) {
      sets.getRange(sets.getLastRow() + 1, 1, rows.length, SET_COLS.length).setValues(rows);
    }
    sessions.appendRow(SESSION_COLS.map((c) => (s[c] === undefined ? "" : s[c])));

    return reply({ ok: true, sets: rows.length });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the URL in a browser is a quick way to confirm the deploy works.
function doGet() {
  return reply({ ok: true, status: "Maceta sync is running" });
}

function getTab(ss, name, cols) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function sessionExists(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return true;
  }
  return false;
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
