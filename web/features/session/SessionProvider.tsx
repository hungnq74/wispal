"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { Reflection, FocusSignal } from "@/lib/types";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useCompanionFSM } from "@/features/companion/useCompanionFSM";
import { useSessionEngine, type StartSessionMeta } from "@/features/session/useSessionEngine";

interface SessionApi {
  start: (intention: string, minutes: number, meta?: StartSessionMeta) => void;
  end: (reason?: "rest" | "abandon") => void;
  takeBreak: () => void;
  closeDay: () => void;
  completeNow: () => void;
  submitReflection: (r: Reflection) => void;
  dispatch: (signal: FocusSignal, vars?: Record<string, string | number | undefined>) => void;
}

const SessionContext = createContext<SessionApi | null>(null);

/**
 * Single mount point for the live engine. Instantiating the FSM + engine here (rather
 * than per-component) means there is exactly ONE timer and ONE presence monitor for the
 * whole app. Also handles local-first hydration and the once-per-day greeting.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const fsm = useCompanionFSM();
  const engine = useSessionEngine(fsm);
  const hydrated = useWispalStore((s) => s.hydrated);
  const didHydrate = useRef(false);
  const didGreet = useRef(false);

  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    void useWispalStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (hydrated && !didGreet.current) {
      didGreet.current = true;
      fsm.greet();
    }
  }, [hydrated, fsm]);

  const api: SessionApi = {
    start: engine.start,
    end: engine.end,
    takeBreak: engine.takeBreak,
    closeDay: engine.closeDay,
    completeNow: engine.completeNow,
    submitReflection: fsm.submitReflection,
    dispatch: fsm.dispatch,
  };

  // Dev affordance: drive signals from the console / Preview MCP without waiting on
  // real-world timers (e.g. simulate fatigue or a goal hit). Never ships in prod.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __wispal?: unknown }).__wispal = {
      ...api,
      store: () => useWispalStore.getState(),
    };
  });

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionApi {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}
