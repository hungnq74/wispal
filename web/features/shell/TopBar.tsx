"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { useSession } from "@/features/session/SessionProvider";
import { tierProgress } from "@/lib/bond";
import { todayKey } from "@/lib/store/defaults";
import { PixelIcon } from "@/features/design/pixel";
import { IconButton, ProgressBar } from "@/features/design/kit";

export function TopBar() {
  const wallet = useWispalStore((s) => s.wallet.softCurrency);
  const bondPoints = useWispalStore((s) => s.companion.bondPoints);
  const bondTier = useWispalStore((s) => s.companion.bondTier);
  // Select primitives (not a freshly-built object) so the store snapshot stays stable.
  const today = useWispalStore((s) => s.dailyLogs[todayKey()]);
  const todayMinutes = today?.totalActiveMinutes ?? 0;
  const goalHit = today?.goalHit ?? false;
  const goal = useWispalStore((s) => s.profile.settings.dailyGoalMinutes);
  const openOverlay = useUIStore((s) => s.openOverlay);
  const { closeDay } = useSession();

  const bond = tierProgress(bondPoints);
  const goalPct = Math.min(100, (todayMinutes / goal) * 100);

  return (
    <header className="pointer-events-auto absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-3 p-4">
      {/* left: bond + day progress */}
      <div className="ds-glass w-48 px-4 py-3">
        <div className="flex items-center gap-2" style={{ font: "600 13px var(--font-body)", color: "var(--ink)" }}>
          <PixelIcon name="heart" color="var(--bloom)" unit={3} />
          <span className="capitalize">{bondTier}</span>
          {bond.next && <span style={{ fontSize: 11, color: "var(--ink-mut)" }}>→ {bond.next}</span>}
        </div>
        <div className="mt-1.5">
          <ProgressBar value={bond.pct * 100} color="var(--bloom)" />
        </div>
        <div className="mt-2 flex items-center gap-1.5" style={{ font: "500 11px var(--font-mono)", color: "var(--ink-mut)" }}>
          today: {todayMinutes}/{goal} min
          {goalHit && <PixelIcon name="check" color="var(--glow)" unit={2} />}
        </div>
        <div className="mt-1">
          <ProgressBar value={goalPct} color="var(--glow)" />
        </div>
      </div>

      {/* right: currency + nav */}
      <div className="flex items-center gap-2">
        <span className="ds-chip ds-chip--outline">
          <PixelIcon name="spark" color="var(--glow)" unit={3} /> {wallet}
        </span>
        <IconButton icon="note" label="Quests" onClick={() => openOverlay("quests")} />
        <IconButton icon="spark" label="Ambience" onClick={() => openOverlay("ambience")} />
        <IconButton icon="bolt" label="Recall" onClick={() => openOverlay("recall")} />
        <IconButton icon="heart" label="Rooms" onClick={() => openOverlay("rooms")} />
        <IconButton icon="play" label="Companions" onClick={() => openOverlay("companions")} />
        <IconButton icon="bag" label="Shop" onClick={() => openOverlay("shop")} />
        <IconButton icon="book" label="Journal" onClick={() => openOverlay("journal")} />
        <IconButton icon="settings" label="Settings" onClick={() => openOverlay("settings")} />
        <IconButton icon="moon" label="End the day" onClick={closeDay} />
      </div>
    </header>
  );
}
