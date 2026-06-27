"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { AccountPanel } from "@/features/shell/AccountPanel";
import { Toggle, FieldLabel } from "@/features/design/kit";
import { FocusGateSettings } from "@/features/focus/FocusGateSettings";

function ToggleRow({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>{label}</div>
        {hint && <div className="mt-0.5" style={{ font: "500 12px/1.4 var(--font-body)", color: "var(--ink-mut)" }}>{hint}</div>}
      </div>
      <Toggle on={on} onClick={() => onChange(!on)} label={label} />
    </div>
  );
}

export function Settings() {
  const profile = useWispalStore((s) => s.profile);
  const update = useWispalStore((s) => s.updateSettings);
  const setProfile = useWispalStore((s) => s.setProfile);
  const s = profile.settings;

  return (
    <div>
      <h2 className="mb-4" style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Settings</h2>

      <FieldLabel>Your name</FieldLabel>
      <input
        value={profile.displayName}
        onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
        className="ds-input"
      />

      <div className="ds-card mt-4 divide-y" style={{ padding: "4px 16px", borderColor: "var(--border-2)" }}>
        <div className="flex items-start justify-between gap-4 py-3">
          <div>
            <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>Anti-burnout guard</div>
            <div className="mt-0.5" style={{ font: "500 12px/1.4 var(--font-body)", color: "var(--ink-mut)" }}>
              Always on. Your wisp insists you rest when you&apos;ve done enough.
            </div>
          </div>
          <span className="ds-chip ds-chip--rest">Always on</span>
        </div>
        <ToggleRow
          label="Gentle streaks"
          hint="A small bonus for showing up on consecutive days. Never a ranking, never pressure."
          on={s.streaksEnabled}
          onChange={(v) => update({ streaksEnabled: v })}
        />
        <ToggleRow
          label="Reminders"
          hint="Let your wisp nudge you with a kind notification."
          on={s.pushEnabled}
          onChange={(v) => update({ pushEnabled: v })}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="ds-card" style={{ padding: 12 }}>
          <span style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>Daily goal (min)</span>
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={s.dailyGoalMinutes}
            onChange={(e) => update({ dailyGoalMinutes: Number(e.target.value) || 90 })}
            className="ds-input mt-1"
            style={{ padding: "8px 12px" }}
          />
        </label>
        <label className="ds-card" style={{ padding: 12 }}>
          <span style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>Session length (min)</span>
          <input
            type="number"
            min={5}
            max={120}
            step={5}
            value={s.preferredSessionLength}
            onChange={(e) => update({ preferredSessionLength: Number(e.target.value) || 25 })}
            className="ds-input mt-1"
            style={{ padding: "8px 12px" }}
          />
        </label>
      </div>

      <FocusGateSettings />

      <AccountPanel />
    </div>
  );
}
