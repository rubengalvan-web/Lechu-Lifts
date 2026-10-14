import React, { useEffect, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  getSheetsConfig,
  saveSheetsConfig,
  enqueueHistory,
  flushQueue,
  queueCount,
} from "../lib/sheets.js";

const ERRORS = {
  "not-configured": "Add the web app URL and token first.",
  network: "Couldn't reach Google — it will retry automatically later.",
  unauthorized: "The token doesn't match the one in your script.",
};

export default function SheetsSync({ history, profile, colors }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [queued, setQueued] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const cfg = await getSheetsConfig();
      setUrl(cfg.url || "");
      setToken(cfg.token || "");
      setQueued(await queueCount());
    })();
  }, []);

  async function save() {
    await saveSheetsConfig({ url: url.trim(), token: token.trim() });
    setMsg("Saved on this device.");
  }

  async function run(backfill) {
    setBusy(true);
    setMsg("");
    await saveSheetsConfig({ url: url.trim(), token: token.trim() });
    if (backfill && profile) await enqueueHistory(profile, history);
    const r = await flushQueue();
    setQueued(r.remaining);
    if (r.error) setMsg(ERRORS[r.error] || `Sheet said: ${r.error}`);
    else setMsg(`Synced ${r.sent} session${r.sent === 1 ? "" : "s"} to your Sheet.`);
    setBusy(false);
  }

  const field = {
    border: `1px solid ${colors.line}`,
    color: colors.ink,
  };

  return (
    <div className="pt-4 mt-4" style={{ borderTop: `2px solid ${colors.ink}` }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs tracking-widest w-full text-left"
        style={{ color: colors.inkFaint }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        GOOGLE SHEETS SYNC {queued > 0 && <span style={{ color: colors.rust }}>· {queued} QUEUED</span>}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Web app URL (ends in /exec)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-transparent"
            style={field}
          />
          <input
            type="text"
            placeholder="Token (same as in your script)"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full text-xs px-2 py-1.5 bg-transparent"
            style={field}
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="text-xs px-3 py-2"
              style={{ border: `1px solid ${colors.line}`, color: colors.inkFaint }}
            >
              SAVE
            </button>
            <button
              onClick={() => run(true)}
              disabled={busy}
              className="flex-1 stencil text-base py-1.5"
              style={{ background: colors.olive, color: colors.paper, opacity: busy ? 0.6 : 1 }}
            >
              {busy ? "SYNCING…" : "SYNC ALL HISTORY"}
            </button>
          </div>
          {queued > 0 && (
            <button
              onClick={() => run(false)}
              disabled={busy}
              className="text-[11px] underline"
              style={{ color: colors.inkFaint }}
            >
              Retry {queued} queued
            </button>
          )}
          {msg && (
            <p className="text-[11px]" style={{ color: colors.inkFaint }}>
              {msg}
            </p>
          )}
          <p className="text-[10px] italic" style={{ color: colors.inkFaint }}>
            New workouts sync automatically when you tap Log Workout. This URL and token stay on this device.
          </p>
        </div>
      )}
    </div>
  );
}
