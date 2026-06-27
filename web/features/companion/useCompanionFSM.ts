"use client";

import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";
import type { DailyLog, DialogueTrigger, FocusSignal, Reflection } from "@/lib/types";
import { transition, type FSMContext } from "@/features/companion/fsm";
import { pickLine, type LineVars } from "@/features/content/loader";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { applyConsistency, CURRENCY_AWARDS } from "@/lib/economy";
import { BOND_AWARDS } from "@/lib/bond";
import { MIN_REWARDED_SESSION_MINUTES } from "@/lib/rewards";
import { missedDay, currentStreak } from "@/lib/streak";
import { todayKey } from "@/lib/store/defaults";
import { scheduleSync } from "@/lib/sync";

/** Ephemeral presentation state for the companion (speech bubble + reflection sheet). */
interface CompanionUI {
  line: string | null;
  lineTrigger: DialogueTrigger | null;
  reflectionOpen: boolean;
  setLine: (line: string | null, trigger: DialogueTrigger | null) => void;
  setReflectionOpen: (open: boolean) => void;
}

export const useCompanionUI = create<CompanionUI>((set) => ({
  line: null,
  lineTrigger: null,
  reflectionOpen: false,
  setLine: (line, lineTrigger) => set({ line, lineTrigger }),
  setReflectionOpen: (reflectionOpen) => set({ reflectionOpen }),
}));

const GIFT_KEY = "wispal:morningGiftDate"; // date a gift was queued for delivery
const GREET_KEY = "wispal:lastGreetDate"; // last day we greeted, to greet once/day

function readLS(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLS(key: string, value: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* private mode — non-fatal */
  }
}
function clearLS(key: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

const MORNING_GIFT_CURRENCY = 20;

function requestedSparks(base: number, streaksEnabled: boolean, dailyLogs: Record<string, DailyLog>) {
  return applyConsistency(base, streaksEnabled, currentStreak(dailyLogs));
}

function isRewardable(vars: LineVars): boolean {
  return vars.rewardable === 1;
}

function shouldQueueMorningGift(): boolean {
  const store = useWispalStore.getState();
  const today = todayKey();
  const log = store.todayLog();
  if (log.reflection) return true;
  return store.sessions.some(
    (session) =>
      session.completed &&
      session.startedAt.slice(0, 10) === today &&
      session.actualActiveMinutes >= MIN_REWARDED_SESSION_MINUTES,
  );
}

/**
 * Drives the companion: turns FocusSignals into mood transitions, applies the FSM's
 * side effects to the store (bond/currency/growth — currency scaled only by the opt-in
 * consistency bonus), and resolves dialogue triggers into real words from the content
 * pack. The FSM itself stays pure; all the wiring lives here.
 */
export function useCompanionFSM() {
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setLine = useCompanionUI((s) => s.setLine);
  const setReflectionOpen = useCompanionUI((s) => s.setReflectionOpen);

  const speak = useCallback(
    (trigger: DialogueTrigger | null, vars: LineVars = {}) => {
      if (!trigger) return;
      const { companion } = useWispalStore.getState();
      const picked = pickLine(companion.voicePackId, trigger, companion.bondTier, vars);
      if (picked) setLine(picked.text, trigger);
    },
    [setLine],
  );

  const dispatch = useCallback(
    (signal: FocusSignal, vars: LineVars = {}) => {
      const store = useWispalStore.getState();
      // Never act before local data has loaded. The presence monitor fires an immediate
      // "active" on subscribe (pre-hydration); without this guard that heartbeat would
      // write-through the DEFAULT companion and clobber the persisted bond/cosmetics.
      if (!store.hydrated) return;
      const { companion, profile, dailyLogs } = store;
      const ctx: FSMContext = {
        fatigueGuardEnabled: profile.settings.fatigueGuardEnabled,
        missedDay: signal === "app_open" ? missedDay(dailyLogs) : false,
      };

      const { mood, dialogue, effects } = transition(companion.mood, signal, ctx);

      store.setMood(mood);
      const petTriggerBySignal = {
        app_open: "idle",
        session_start: "session_start",
        flow_detected: "flow_hit",
        session_complete: "session_complete",
        daily_goal_hit: "goal_hit",
        fatigue_threshold: "fatigue",
        break_started: "rest",
        day_closed: "rest",
      } as const;
      const petTrigger = petTriggerBySignal[signal as keyof typeof petTriggerBySignal];
      if (petTrigger) store.triggerPetAction(petTrigger, { source: "system" });

      const today = todayKey();
      const requestedCurrency = effects.currency
        ? requestedSparks(effects.currency, profile.settings.streaksEnabled, dailyLogs)
        : 0;

      if (signal === "session_complete" && !isRewardable(vars)) {
        // Short/test blocks are logged but do not mint bond, sparks, or world growth.
      } else if (signal === "daily_goal_hit") {
        store.upsertDailyLog(today, { goalHit: true });
        const claimed = store.claimDailyReward(today, "daily_goal", requestedCurrency);
        if (claimed.claimed && effects.bond) store.awardBond(effects.bond);
      } else if (signal === "break_started") {
        if (isRewardable(vars)) {
          const claimed = store.claimDailyReward(today, "rest", requestedCurrency);
          if (claimed.claimed && effects.bond) store.awardBond(effects.bond);
        }
      } else {
        if (effects.bond) store.awardBond(effects.bond);
        if (effects.growth) store.addGrowth(effects.growth);
        if (effects.currency) store.awardDailySparks(today, requestedCurrency);
      }

      // Inject default template vars so packs can reference {name}/{intention}/{win}.
      const merged: LineVars = {
        name: profile.displayName,
        ...vars,
      };
      speak(dialogue, merged);

      if (effects.openReflection) setReflectionOpen(true);
      if (effects.queueMorningGift && shouldQueueMorningGift()) writeLS(GIFT_KEY, today);

      if (settleTimer.current) clearTimeout(settleTimer.current);
      if (effects.autoSettleMs) {
        settleTimer.current = setTimeout(() => {
          // Only settle if we're still in the transient celebrating state.
          if (useWispalStore.getState().companion.mood === "celebrating") {
            useWispalStore.getState().setMood("idle");
            setLine(null, null);
          }
        }, effects.autoSettleMs);
      }
    },
    [speak, setLine, setReflectionOpen],
  );

  /** First-open-of-the-day greeting + morning-gift delivery (called once on mount). */
  const greet = useCallback(() => {
    const today = todayKey();
    if (readLS(GREET_KEY) === today) return; // already greeted today
    writeLS(GREET_KEY, today);

    dispatch("app_open");

    // Deliver a queued morning gift if it was set on a previous day.
    const giftDate = readLS(GIFT_KEY);
      if (giftDate && giftDate !== today) {
        clearLS(GIFT_KEY);
        const store = useWispalStore.getState();
        const gift = store.claimDailyReward(today, "morning_gift", MORNING_GIFT_CURRENCY, {
          exemptFromDailyCap: true,
        });
      // Layer the gift line shortly after the greeting so both register.
      if (gift.claimed && gift.awardedSparks > 0) {
        store.triggerPetAction("gift", { source: "system" });
        setTimeout(() => speak("morning_gift"), 1400);
      }
    }
  }, [dispatch, speak]);

  /** Submit the evening reflection — stores it and pays the (bounded) reflection reward. */
  const submitReflection = useCallback(
    (reflection: Reflection) => {
      const store = useWispalStore.getState();
      const before = store.todayLog();
      store.setReflection(todayKey(), reflection);
      if (!before.reflection) {
        const reward = store.claimDailyReward(
          todayKey(),
          "reflection",
          requestedSparks(
            CURRENCY_AWARDS.reflection,
            store.profile.settings.streaksEnabled,
            store.dailyLogs,
          ),
        );
        if (reward.claimed) store.awardBond(BOND_AWARDS.reflection);
      }
      setReflectionOpen(false);
      store.setMood("resting");
      store.triggerPetAction("reflection", { source: "system" });
      scheduleSync(); // day-close is a sync checkpoint
    },
    [setReflectionOpen],
  );

  useEffect(() => {
    return () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    };
  }, []);

  return { dispatch, greet, submitReflection };
}
