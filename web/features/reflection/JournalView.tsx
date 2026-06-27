"use client";

import Link from "next/link";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { PixelIcon } from "@/features/design/pixel";
import { WeeklyWispReport } from "@/features/reflection/WeeklyWispReport";

const MOOD_LABEL = ["", "rough", "meh", "okay", "good", "great"];

/** The accumulated journal — reflections rendered back as a gentle record (spec §10). */
export function JournalView() {
  const dailyLogs = useWispalStore((s) => s.dailyLogs);
  const petMemory = useWispalStore((s) => s.companion.petMemory);
  const entries = Object.values(dailyLogs)
    .filter((l) => l.reflection || l.sessionsCompleted > 0)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Your journal</h2>
        <Link href="/wrapped" className="ds-chip ds-chip--wisp" style={{ textDecoration: "none" }}>
          Year in Study →
        </Link>
      </div>

      <WeeklyWispReport />

      {petMemory.length > 0 && (
        <div className="ds-card mb-6" style={{ padding: 18 }}>
          <div className="ds-eyebrow">Moments with your wisp</div>
          <ul className="mt-3 space-y-2" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
            {petMemory.slice(0, 5).map((event) => (
              <li key={event.id} className="flex items-center justify-between gap-3">
                <span>{event.label}</span>
                <span style={{ font: "600 10px var(--font-mono)", color: "var(--ink-mut)" }}>
                  {event.createdAt.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {entries.length === 0 && (
        <p
          className="ds-card text-center"
          style={{ font: "500 14px/1.5 var(--font-body)", color: "var(--ink-dim)" }}
        >
          Your reflections will gather here. The first one is the hardest — and it isn&apos;t hard at all.
        </p>
      )}

      <ul className="space-y-3">
        {entries.map((log) => (
          <li key={log.date} className="ds-card" style={{ padding: 16 }}>
            <div className="flex items-center justify-between">
              <span style={{ font: "600 13px var(--font-mono)", color: "var(--ink-dim)" }}>{log.date}</span>
              <span className="flex items-center gap-1.5" style={{ font: "500 11px var(--font-mono)", color: "var(--ink-mut)" }}>
                {log.totalActiveMinutes} min · {log.sessionsCompleted}{" "}
                {log.sessionsCompleted === 1 ? "block" : "blocks"}
                {log.goalHit && <PixelIcon name="check" color="var(--glow)" unit={2} />}
              </span>
            </div>
            {log.reflection && (
              <div className="mt-2 flex items-start gap-3">
                <span
                  title={MOOD_LABEL[log.reflection.mood]}
                  style={{
                    marginTop: 3,
                    width: 14,
                    height: 14,
                    flex: "none",
                    borderRadius: "50%",
                    background: "var(--wisp)",
                    opacity: 0.35 + log.reflection.mood * 0.13,
                  }}
                />
                <div>
                  <p style={{ font: "600 15px var(--font-body)", color: "var(--ink)" }}>{log.reflection.win}</p>
                  {log.reflection.note && (
                    <p className="mt-0.5" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
                      {log.reflection.note}
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
