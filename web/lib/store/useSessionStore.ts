"use client";

import { create } from "zustand";
import type { FocusSession } from "@/lib/types";

export type SessionStatus = "idle" | "running" | "complete";

/**
 * EPHEMERAL session runtime (never persisted as-is). The 1s tick lives here so the
 * timer UI can subscribe, but these counters are exactly the "heartbeat" state the
 * spec says must stay client-side — they NEVER hit a server. Only the finalized
 * FocusSession + DailyLog are persisted (and later synced) at session end.
 */
interface SessionRuntime {
  status: SessionStatus;
  session: FocusSession | null;
  intention: string;
  plannedMinutes: number;
  elapsedSec: number;
  activeSec: number; // counts only while active+visible — idle time doesn't count
  idle: boolean;
  flowReached: boolean;
  goalFired: boolean;
  fatigueFired: boolean;
  /** today's active minutes BEFORE this session (from the persisted daily log) */
  dayBaselineMinutes: number;

  set: (patch: Partial<SessionRuntime>) => void;
  reset: () => void;
}

const INITIAL: Omit<SessionRuntime, "set" | "reset"> = {
  status: "idle",
  session: null,
  intention: "",
  plannedMinutes: 25,
  elapsedSec: 0,
  activeSec: 0,
  idle: false,
  flowReached: false,
  goalFired: false,
  fatigueFired: false,
  dayBaselineMinutes: 0,
};

export const useSessionStore = create<SessionRuntime>((set) => ({
  ...INITIAL,
  set: (patch) => set(patch),
  reset: () => set({ ...INITIAL }),
}));
