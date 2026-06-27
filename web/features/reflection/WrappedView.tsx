"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { NIGHT_MILESTONES } from "@/lib/world";
import { Wisp } from "@/features/design/pixel";

/**
 * "Year in Study" — the share artifact (spec §7). V1 renders it client-side from the
 * local store. The PUBLIC, server-rendered share variant (rendered from Supabase by
 * user id, for a shareable URL) is a seam left for when cloud + sharing ship.
 */
function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="ds-card text-center" style={{ padding: 20 }}>
      <div style={{ font: "700 30px var(--font-head)", color: "var(--wisp)" }}>{value}</div>
      <div className="mt-1" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>{label}</div>
    </div>
  );
}

export function WrappedView() {
  const hydrated = useWispalStore((s) => s.hydrated);
  const dailyLogs = useWispalStore((s) => s.dailyLogs);
  const sessions = useWispalStore((s) => s.sessions);
  const bondTier = useWispalStore((s) => s.companion.bondTier);
  const growth = useWispalStore((s) => s.world.growthPoints);
  const name = useWispalStore((s) => s.profile.displayName);
  const petMemory = useWispalStore((s) => s.companion.petMemory);

  useEffect(() => {
    if (!hydrated) void useWispalStore.getState().hydrate();
  }, [hydrated]);

  const stats = useMemo(() => {
    const logs = Object.values(dailyLogs);
    const totalMinutes = logs.reduce((a, l) => a + l.totalActiveMinutes, 0);
    const daysShownUp = logs.filter(
      (l) => l.totalActiveMinutes > 0 || l.sessionsCompleted > 0 || l.reflection,
    ).length;
    const blocks = logs.reduce((a, l) => a + l.sessionsCompleted, 0);
    const goals = logs.filter((l) => l.goalHit).length;
    const flows = sessions.filter((s) => s.flowDetected).length;
    const milestones = NIGHT_MILESTONES.filter((m) => growth >= m.at);
    const wins = logs
      .filter((l) => l.reflection?.win)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map((l) => l.reflection!.win);
    return { totalMinutes, daysShownUp, blocks, goals, flows, milestones, wins };
  }, [dailyLogs, sessions, growth]);

  const hours = Math.floor(stats.totalMinutes / 60);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-5 py-12">
      <div className="flex flex-col items-center text-center">
        <Wisp size="md" />
        <div className="mt-3 ds-eyebrow">Wispal · Night Study Club</div>
        <h1 className="mt-2" style={{ font: "700 36px var(--font-head)", color: "var(--ink)" }}>
          {name}&apos;s Year in Study
        </h1>
        <p className="mt-2" style={{ font: "500 15px var(--font-body)", color: "var(--ink-dim)" }}>
          Not hours grinded — moments lived. Here&apos;s the night you painted.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat value={stats.daysShownUp} label="days you showed up" />
        <Stat value={stats.blocks} label="blocks finished" />
        <Stat value={hours > 0 ? `${hours}h` : `${stats.totalMinutes}m`} label="time with your wisp" />
        <Stat value={stats.goals} label="goals reached" />
        <Stat value={stats.flows} label="times in flow" />
        <Stat value={<span className="capitalize">{bondTier}</span>} label="bond reached" />
        <Stat value={petMemory.length} label="wisp moments" />
      </div>

      <div className="ds-card mt-8">
        <h2 style={{ font: "600 18px var(--font-head)", color: "var(--ink)" }}>Your night grew into…</h2>
        {stats.milestones.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {stats.milestones.map((m) => (
              <li key={m.id} className="ds-chip ds-chip--outline">{m.label}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2" style={{ font: "500 14px var(--font-body)", color: "var(--ink-dim)" }}>a first star — and that&apos;s a start.</p>
        )}
      </div>

      {stats.wins.length > 0 && (
        <div className="ds-card mt-6">
          <h2 style={{ font: "600 18px var(--font-head)", color: "var(--ink)" }}>Little wins you noticed</h2>
          <ul className="mt-2 space-y-1.5" style={{ font: "500 14px var(--font-body)", color: "var(--ink)" }}>
            {stats.wins.map((w, i) => (
              <li key={i}>· {w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10 text-center">
        <Link href="/" className="ds-btn ds-btn--primary" style={{ textDecoration: "none" }}>
          ← back to your wisp
        </Link>
      </div>
    </div>
  );
}
