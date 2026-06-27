"use client";

import { useState } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { signInWithEmail } from "@/lib/sync/account";
import { Button } from "@/features/design/kit";

/**
 * Guest → account upgrade (spec §8). When cloud is configured, sending a magic link
 * signs the user in; on first sign-in we migrate ALL local Dexie data into Postgres so
 * bond + journal are never lost. When cloud is OFF, we say so plainly — the user is
 * playing locally and their progress is safe on this device.
 */
export function AccountPanel() {
  const profile = useWispalStore((s) => s.profile);
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="ds-card mt-5" style={{ padding: 16 }}>
        <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>Playing locally</div>
        <p className="mt-0.5" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-mut)" }}>
          Your night, bond, and journal are saved on this device. Cloud sync isn&apos;t set up yet —
          add Supabase keys to carry everything across devices.
        </p>
      </div>
    );
  }

  const sendLink = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const ok = await signInWithEmail(email.trim());
      setStatus(ok ? "Check your email for a sign-in link ✉️" : "Couldn't send the link.");
    } catch {
      setStatus("Something went wrong — you're still safe locally.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ds-card mt-5" style={{ padding: 16 }}>
      <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>
        {profile.isGuest ? "Save your progress" : "Synced ✓"}
      </div>
      <p className="mt-0.5" style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>
        Create a free account to keep your wisp across devices. Nothing is lost.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="ds-input"
          style={{ padding: "9px 12px", fontSize: 14 }}
        />
        <Button variant="primary" onClick={sendLink} disabled={busy || !email.includes("@")}>
          {busy ? "…" : "Send link"}
        </Button>
      </div>
      {status && <p className="mt-2" style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>{status}</p>}
    </div>
  );
}
