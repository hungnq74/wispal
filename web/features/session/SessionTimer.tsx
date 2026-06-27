"use client";

import { useSessionStore } from "@/lib/store/useSessionStore";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useSession } from "@/features/session/SessionProvider";
import { Button, ProgressBar } from "@/features/design/kit";

function fmt(totalSec: number): string {
  const s = Math.max(0, totalSec);
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

/**
 * The active-session HUD. Time is measured in ACTIVE seconds — when you step away it
 * pauses (no penalty, just paused), so the bar only fills with real focus. When the
 * fatigue guard trips (companion mood → tired) we surface a prominent, friendly rest CTA
 * because resting is a win condition (spec §4).
 */
export function SessionTimer() {
  const { activeSec, plannedMinutes, idle } = useSessionStore();
  const mood = useWispalStore((s) => s.companion.mood);
  const { end, takeBreak } = useSession();

  const target = plannedMinutes * 60;
  const remaining = target - activeSec;
  const pct = Math.min(100, (activeSec / target) * 100);
  const tired = mood === "tired";

  return (
    <div className="ds-glass w-full max-w-md p-6 text-center">
      <div
        style={{
          font: "700 56px var(--font-pixel)",
          color: "var(--ink)",
          letterSpacing: 2,
          textShadow: "0 0 22px rgba(143,184,240,.35)",
        }}
        className="tabular-nums"
      >
        {fmt(remaining)}
      </div>
      <div className="mt-1" style={{ font: "500 13px var(--font-body)", color: "var(--wisp)" }}>
        {idle ? "paused — I'll wait for you" : "studying together…"}
      </div>

      <div className="mt-4">
        <ProgressBar value={pct} color="var(--wisp)" />
      </div>

      {tired ? (
        <div
          className="mt-4 rounded-2xl p-3 text-sm"
          style={{ background: "color-mix(in srgb, var(--rest) 18%, transparent)", color: "var(--ink)" }}
        >
          You&apos;ve done plenty today. Resting is the win now.
          <button
            onClick={takeBreak}
            className="ds-btn mt-2 w-full"
            style={{ color: "var(--on-accent)", background: "var(--rest)", borderBottom: "4px solid #5d86c4" }}
          >
            Rest now
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={takeBreak}>
            Take a break
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => end("abandon")}>
            End early
          </Button>
        </div>
      )}
    </div>
  );
}
