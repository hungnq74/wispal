"use client";

import { useEffect, useMemo, useState } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { notifyGateUpdated } from "@/lib/extensionBridge";
import { defaultFocusGateProfile } from "@/lib/store/defaults";
import { Button, FieldLabel, Pill, Toggle } from "@/features/design/kit";

function parseDomains(value: string) {
  return value
    .split(/\n|,/)
    .map((x) => x.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
    .filter(Boolean);
}

export function FocusGateSettings() {
  const focusGateProfiles = useWispalStore((s) => s.focusGateProfiles);
  const activeFocusGateId = useWispalStore((s) => s.activeFocusGateId);
  const updateFocusGate = useWispalStore((s) => s.updateFocusGate);
  const gate = useMemo(
    () =>
      focusGateProfiles.find((p) => p.id === activeFocusGateId) ??
      focusGateProfiles[0] ??
      defaultFocusGateProfile(),
    [activeFocusGateId, focusGateProfiles],
  );
  const [blocklist, setBlocklist] = useState(gate.blocklist.join("\n"));
  const [allowlist, setAllowlist] = useState(gate.allowlist.join("\n"));

  useEffect(() => {
    notifyGateUpdated(gate);
  }, [gate]);

  const saveDomains = () => {
    updateFocusGate({ blocklist: parseDomains(blocklist), allowlist: parseDomains(allowlist) });
  };

  return (
    <div className="ds-card mt-4" style={{ padding: 16 }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 style={{ font: "600 17px var(--font-head)", color: "var(--ink)" }}>Gentle focus gate</h3>
          <p className="mt-1" style={{ font: "500 12px/1.45 var(--font-body)", color: "var(--ink-mut)" }}>
            Strict blocking works in the Chrome extension. The web app keeps the same settings.
          </p>
        </div>
        <Toggle on={gate.enabled} onClick={() => updateFocusGate({ enabled: !gate.enabled })} label="Focus gate" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Pill active={gate.mode === "soft"} onClick={() => updateFocusGate({ mode: "soft" })}>soft</Pill>
        <Pill active={gate.mode === "strict"} onClick={() => updateFocusGate({ mode: "strict" })}>strict</Pill>
        <Pill active={gate.activeOnlyDuringSessions} onClick={() => updateFocusGate({ activeOnlyDuringSessions: !gate.activeOnlyDuringSessions })}>
          sessions only
        </Pill>
      </div>

      <FieldLabel>Blocklist</FieldLabel>
      <textarea value={blocklist} onChange={(e) => setBlocklist(e.target.value)} className="ds-input min-h-24" />
      <FieldLabel>Allowlist</FieldLabel>
      <textarea value={allowlist} onChange={(e) => setAllowlist(e.target.value)} className="ds-input min-h-20" />

      <label className="mt-3 block">
        <span style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>Bypass minutes</span>
        <input
          type="number"
          min={1}
          max={30}
          value={gate.bypassMinutes}
          onChange={(e) => updateFocusGate({ bypassMinutes: Number(e.target.value) || 5 })}
          className="ds-input mt-1"
        />
      </label>

      <Button variant="secondary" className="mt-3 w-full" onClick={saveDomains}>
        Save gate domains
      </Button>
    </div>
  );
}
