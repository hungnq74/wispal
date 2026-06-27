"use client";

/**
 * Presence monitor — the bridge between "is the user actually here?" and the session
 * engine's heartbeats. It MERGES two signal sources:
 *
 *   1. The new-tab EXTENSION (when embedded): postMessage events carrying chrome.idle
 *      state. This is the authoritative signal when present.
 *   2. STANDALONE fallback (no extension): the Page Visibility API plus an in-page
 *      idle timer (reset on real user input). Lets the webapp work on its own.
 *
 * PRIVACY: the only thing that ever crosses from the extension is a coarse status
 * (active / idle / locked) — never page content, URLs, history, or keystrokes (spec §5).
 */

export const PRESENCE_MESSAGE_SOURCE = "wispal-extension" as const;
export type PresenceState = "active" | "idle";
const IDLE_MS = 60_000; // ~60s, matches chrome.idle detection interval

interface ExtPresenceMessage {
  source: typeof PRESENCE_MESSAGE_SOURCE;
  kind: "presence";
  state: "active" | "idle" | "locked";
}

function isExtMessage(data: unknown): data is ExtPresenceMessage {
  return (
    !!data &&
    typeof data === "object" &&
    (data as { source?: unknown }).source === PRESENCE_MESSAGE_SOURCE &&
    (data as { kind?: unknown }).kind === "presence"
  );
}

export interface PresenceMonitor {
  getState: () => PresenceState;
  subscribe: (cb: (state: PresenceState) => void) => () => void;
  destroy: () => void;
}

export function createPresenceMonitor(): PresenceMonitor {
  let extIdle = false; // last known extension idle/locked
  let extSeen = false; // did we ever hear from an extension?
  let lastInput = Date.now();
  let current: PresenceState = "active";
  const listeners = new Set<(s: PresenceState) => void>();

  function compute(): PresenceState {
    const visible = typeof document === "undefined" || document.visibilityState === "visible";
    // When the extension is present, trust its idle signal; otherwise use the in-page
    // idle timer. Either way, a hidden tab is always idle.
    const idleByInput = !extSeen && Date.now() - lastInput > IDLE_MS;
    const idle = !visible || (extSeen ? extIdle : idleByInput);
    return idle ? "idle" : "active";
  }

  function emit() {
    const next = compute();
    if (next !== current) {
      current = next;
      listeners.forEach((cb) => cb(current));
    }
  }

  const onMessage = (e: MessageEvent) => {
    if (!isExtMessage(e.data)) return;
    extSeen = true;
    extIdle = e.data.state !== "active";
    emit();
  };

  const onVisibility = () => emit();

  const onInput = () => {
    lastInput = Date.now();
    emit();
  };

  // Poll keeps the in-page idle timer honest when there's no extension and no events.
  let poll: ReturnType<typeof setInterval> | null = null;

  if (typeof window !== "undefined") {
    window.addEventListener("message", onMessage);
    document.addEventListener("visibilitychange", onVisibility);
    for (const ev of ["pointerdown", "keydown", "pointermove", "scroll", "wheel"]) {
      window.addEventListener(ev, onInput, { passive: true });
    }
    poll = setInterval(emit, 5_000);
  }

  return {
    getState: () => current,
    subscribe: (cb) => {
      listeners.add(cb);
      cb(current);
      return () => listeners.delete(cb);
    },
    destroy: () => {
      listeners.clear();
      if (typeof window !== "undefined") {
        window.removeEventListener("message", onMessage);
        document.removeEventListener("visibilitychange", onVisibility);
        for (const ev of ["pointerdown", "keydown", "pointermove", "scroll", "wheel"]) {
          window.removeEventListener(ev, onInput);
        }
      }
      if (poll) clearInterval(poll);
    },
  };
}
