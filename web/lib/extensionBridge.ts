"use client";

import type { FocusGateProfile, SessionMode } from "@/lib/types";

type BridgeMessage =
  | {
      source: "wispal-web";
      kind: "wispal.session.started";
      sessionId: string;
      mode: SessionMode;
      gate: FocusGateProfile;
    }
  | { source: "wispal-web"; kind: "wispal.session.ended" }
  | { source: "wispal-web"; kind: "wispal.gate.updated"; gate: FocusGateProfile }
  | { source: "wispal-web"; kind: "wispal.gate.bypass"; minutes: number };

function post(message: BridgeMessage) {
  if (typeof window === "undefined") return;
  try {
    window.parent?.postMessage(message, "*");
  } catch {
    /* Standalone web app: no extension bridge to receive it. */
  }
}

export function notifySessionStarted(sessionId: string, mode: SessionMode, gate: FocusGateProfile) {
  post({ source: "wispal-web", kind: "wispal.session.started", sessionId, mode, gate });
}

export function notifySessionEnded() {
  post({ source: "wispal-web", kind: "wispal.session.ended" });
}

export function notifyGateUpdated(gate: FocusGateProfile) {
  post({ source: "wispal-web", kind: "wispal.gate.updated", gate });
}

export function requestGateBypass(minutes: number) {
  post({ source: "wispal-web", kind: "wispal.gate.bypass", minutes });
}
