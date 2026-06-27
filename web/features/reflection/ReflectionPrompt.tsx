"use client";

import { useState } from "react";
import { useCompanionUI } from "@/features/companion/useCompanionFSM";
import { useSession } from "@/features/session/SessionProvider";
import { Button, FieldLabel } from "@/features/design/kit";
import { PixelIcon } from "@/features/design/pixel";

const VALUES: (1 | 2 | 3 | 4 | 5)[] = [1, 2, 3, 4, 5];

/**
 * Evening reflection — THIS is the "log", disguised as care (spec §3). It writes a
 * DailyLog.reflection and pays the (bounded) reflection reward via submitReflection().
 * No grade, no shame — a quiet check-in before logging off.
 */
export function ReflectionPrompt() {
  const open = useCompanionUI((s) => s.reflectionOpen);
  const setReflectionOpen = useCompanionUI((s) => s.setReflectionOpen);
  const { submitReflection } = useSession();
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [win, setWin] = useState("");
  const [note, setNote] = useState("");

  if (!open) return null;

  const submit = () => {
    submitReflection({
      mood: mood ?? 3,
      win: win.trim() || "showed up",
      note: note.trim() || undefined,
      submittedAt: new Date().toISOString(),
    });
    setMood(null);
    setWin("");
    setNote("");
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" style={{ background: "rgba(8,6,20,0.6)", backdropFilter: "blur(6px)" }}>
      <div className="ds-card ds-card--night animate-pop-in w-full max-w-md">
        <h2 style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>How&apos;d it go?</h2>
        <p className="mt-1" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
          No grade. Just a check-in before you log off.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          {VALUES.map((v) => {
            const on = mood === v;
            return (
              <button
                key={v}
                aria-label={`mood ${v}`}
                onClick={() => setMood(v)}
                style={{
                  width: on ? 42 : 36,
                  height: on ? 42 : 36,
                  borderRadius: "50%",
                  background: on ? "var(--wisp)" : "var(--surface-2)",
                  border: on ? "2px solid var(--ink)" : "2px solid var(--border)",
                  boxShadow: on ? "0 0 14px -2px var(--wisp)" : undefined,
                  cursor: "pointer",
                  transition: "all .15s ease",
                }}
              />
            );
          })}
        </div>
        <div className="mt-2 text-center" style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)" }}>
          rough ··· great
        </div>

        <div className="mt-5">
          <FieldLabel>One thing that went well</FieldLabel>
          <input
            value={win}
            onChange={(e) => setWin(e.target.value)}
            placeholder="even something small"
            className="ds-input"
          />
        </div>

        <div className="mt-4">
          <FieldLabel>Anything else? (optional)</FieldLabel>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="ds-input"
            style={{ resize: "none" }}
          />
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="ghost" onClick={() => setReflectionOpen(false)}>
            Later
          </Button>
          <Button variant="primary" className="flex-1" onClick={submit}>
            <PixelIcon name="moon" color="var(--on-accent)" unit={3} /> Good night
          </Button>
        </div>
      </div>
    </div>
  );
}
