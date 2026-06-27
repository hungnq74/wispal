"use client";

import { useCallback, useEffect, useRef } from "react";
import type { FocusSession } from "@/lib/types";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { newId, todayKey } from "@/lib/store/defaults";
import { createPresenceMonitor, type PresenceMonitor } from "@/lib/signals/presence";
import { scheduleSync } from "@/lib/sync";
import { notifySessionEnded, notifySessionStarted } from "@/lib/extensionBridge";
import type { SessionMode } from "@/lib/types";
import { MIN_REWARDED_SESSION_MINUTES } from "@/lib/rewards";

/** Tunables (spec §5). Fatigue caps are conservative and BOTH apply (continuous + daily). */
const FLOW_MINUTES = 15;
const CONTINUOUS_FATIGUE_MIN = 90; // one block running this long → urge a break
const DAILY_FATIGUE_MIN = 180; // ~3h total active today → urge stopping for the day

type CompanionDispatch = (signal: import("@/lib/types").FocusSignal, vars?: Record<string, string | number | undefined>) => void;

interface FSMApi {
  dispatch: CompanionDispatch;
}

export interface StartSessionMeta {
  mode?: SessionMode;
  questId?: string;
  subjectId?: string | null;
  roomId?: string;
}

/**
 * Session engine. Owns the 1-second tick, derives active vs idle from the presence
 * monitor, and emits FocusSignals to the companion FSM. Crucially, the tick mutates
 * ONLY local runtime state — it never touches the network. The store + cloud see one
 * finalized FocusSession + DailyLog at session end, and `scheduleSync()` debounces even
 * that into a single push (spec §2.2 / §10).
 */
export function useSessionEngine(fsm: FSMApi) {
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);
  const monitor = useRef<PresenceMonitor | null>(null);
  const continuousActiveSec = useRef(0);

  const stopTick = useCallback(() => {
    if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
  }, []);

  /** Finalize the current draft session into the persisted store + daily log. */
  const finalize = useCallback((completed: boolean) => {
    const s = useSessionStore.getState();
    const store = useWispalStore.getState();
    if (!s.session) return;
    const actualActiveMinutes = Math.round(s.activeSec / 60);
    const session: FocusSession = {
      ...s.session,
      actualActiveMinutes,
      endedAt: new Date().toISOString(),
      completed,
      flowDetected: s.flowReached,
    };
    store.saveSession(session);
    notifySessionEnded();

    const date = todayKey();
    const prev = store.todayLog();
    store.upsertDailyLog(date, {
      totalActiveMinutes: s.dayBaselineMinutes + actualActiveMinutes,
      sessionsCompleted: prev.sessionsCompleted + (completed ? 1 : 0),
      goalHit: prev.goalHit || s.goalFired,
    });
    scheduleSync(); // one debounced changeset — not per heartbeat
  }, []);

  const onTick = useCallback(() => {
    const s = useSessionStore.getState();
    if (s.status !== "running") return;
    const store = useWispalStore.getState();
    const active = monitor.current?.getState() === "active";

    const patch: Partial<typeof s> = { elapsedSec: s.elapsedSec + 1, idle: !active };
    if (active) {
      patch.activeSec = s.activeSec + 1;
      continuousActiveSec.current += 1;
    } else {
      continuousActiveSec.current = 0; // a lull breaks the flow streak
    }
    const activeSec = patch.activeSec ?? s.activeSec;
    s.set(patch);

    // Flow: sustained continuous focus within the block (once per block).
    if (!s.flowReached && continuousActiveSec.current >= FLOW_MINUTES * 60) {
      useSessionStore.getState().set({ flowReached: true });
      fsm.dispatch("flow_detected");
    }

    const dayMinutes = s.dayBaselineMinutes + Math.floor(activeSec / 60);
    const goalMinutes = store.profile.settings.dailyGoalMinutes;

    // Daily goal (bounded — fires once).
    if (!s.goalFired && !store.todayLog().goalHit && dayMinutes >= goalMinutes) {
      useSessionStore.getState().set({ goalFired: true });
      fsm.dispatch("daily_goal_hit");
    }

    // Fatigue guard (anti-burnout). Either cap trips it; fires once.
    if (
      store.profile.settings.fatigueGuardEnabled &&
      !s.fatigueFired &&
      (continuousActiveSec.current >= CONTINUOUS_FATIGUE_MIN * 60 ||
        dayMinutes >= DAILY_FATIGUE_MIN)
    ) {
      useSessionStore.getState().set({ fatigueFired: true });
      fsm.dispatch("fatigue_threshold");
    }

    // Completion: enough ACTIVE time (idle never counts toward finishing).
    if (activeSec >= s.plannedMinutes * 60) {
      stopTick();
      finalize(true);
      useSessionStore.getState().set({ status: "complete" });
      fsm.dispatch("session_complete", {
        intention: s.intention,
        rewardable: activeSec >= MIN_REWARDED_SESSION_MINUTES * 60 ? 1 : 0,
      });
    }
  }, [fsm, finalize, stopTick]);

  const start = useCallback(
    (intention: string, minutes: number, meta: StartSessionMeta = {}) => {
      const store = useWispalStore.getState();
      const todayLog = store.todayLog();
      const baseline = todayLog.totalActiveMinutes;
      const session: FocusSession = {
        id: newId(),
        userId: store.profile.id,
        intention,
        mode: meta.mode ?? "focus",
        questId: meta.questId,
        subjectId: meta.subjectId ?? undefined,
        roomId: meta.roomId,
        plannedMinutes: minutes,
        actualActiveMinutes: 0,
        startedAt: new Date().toISOString(),
        endedAt: null,
        completed: false,
        flowDetected: false,
      };
      continuousActiveSec.current = 0;
      useSessionStore.getState().set({
        status: "running",
        session,
        intention,
        plannedMinutes: minutes,
        elapsedSec: 0,
        activeSec: 0,
        idle: false,
        flowReached: false,
        goalFired: todayLog.goalHit,
        fatigueFired: false,
        dayBaselineMinutes: baseline,
      });
      fsm.dispatch("session_start", { intention, minutes });
      notifySessionStarted(session.id, session.mode, store.activeFocusGate());
      stopTick();
      tick.current = setInterval(onTick, 1000);
    },
    [fsm, onTick, stopTick],
  );

  /** End the current block early. `rest` rewards resting; `abandon` is a no-penalty close. */
  const end = useCallback(
    (reason: "rest" | "abandon" = "abandon") => {
      const current = useSessionStore.getState();
      if (current.status !== "running") return;
      const rewardableRest =
        current.activeSec >= MIN_REWARDED_SESSION_MINUTES * 60 || current.fatigueFired;
      stopTick();
      finalize(false);
      useSessionStore.getState().set({ status: "idle" });
      fsm.dispatch(reason === "rest" ? "break_started" : "session_abandoned", {
        rewardable: reason === "rest" && rewardableRest ? 1 : 0,
      });
    },
    [fsm, finalize, stopTick],
  );

  const takeBreak = useCallback(() => end("rest"), [end]);

  /**
   * Force-complete the running block through the REAL finalize path. Dev/test only —
   * lets us exercise completion → daily log → celebration when wall-clock (or a hidden
   * tab) would otherwise make active time never accrue.
   */
  const completeNow = useCallback(() => {
    if (useSessionStore.getState().status !== "running") return;
    stopTick();
    finalize(true);
    const current = useSessionStore.getState();
    const intention = current.intention;
    useSessionStore.getState().set({ status: "complete" });
    fsm.dispatch("session_complete", {
      intention,
      rewardable: current.activeSec >= MIN_REWARDED_SESSION_MINUTES * 60 ? 1 : 0,
    });
  }, [fsm, finalize, stopTick]);

  /** Evening wind-down: open the reflection (the journal disguised as care). */
  const closeDay = useCallback(() => {
    if (useSessionStore.getState().status === "running") end("rest");
    fsm.dispatch("day_closed");
  }, [end, fsm]);

  // Presence → heartbeats (local-only mood signals; never a network call).
  useEffect(() => {
    const m = createPresenceMonitor();
    monitor.current = m;
    const unsub = m.subscribe((state) => {
      fsm.dispatch(state === "active" ? "heartbeat_active" : "heartbeat_idle");
    });
    return () => {
      unsub();
      m.destroy();
      monitor.current = null;
      stopTick();
    };
  }, [fsm, stopTick]);

  return { start, end, takeBreak, closeDay, completeNow };
}
