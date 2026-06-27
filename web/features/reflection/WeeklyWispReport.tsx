"use client";

import { useMemo } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { buildWeeklyReport } from "@/lib/reports";
import { Chip, ProgressBar } from "@/features/design/kit";

function minutesLabel(minutes: number) {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function WeeklyWispReport() {
  const dailyLogs = useWispalStore((s) => s.dailyLogs);
  const sessions = useWispalStore((s) => s.sessions);
  const subjects = useWispalStore((s) => s.subjects);
  const quests = useWispalStore((s) => s.quests);
  const report = useMemo(
    () => buildWeeklyReport({ dailyLogs, sessions, subjects, quests }),
    [dailyLogs, sessions, subjects, quests],
  );
  const max = Math.max(1, ...report.subjectMinutes.map((s) => s.minutes));

  return (
    <div className="ds-card mb-6" style={{ padding: 18 }}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="ds-eyebrow">Weekly Wisp Report</div>
          <h3 className="mt-1" style={{ font: "600 18px var(--font-head)", color: "var(--ink)" }}>
            {report.start} to {report.end}
          </h3>
        </div>
        <Chip tone={report.restBalance === "gentle" ? "wisp" : report.restBalance === "watch" ? "glow" : "ember"}>
          {report.restBalance === "gentle" ? "balanced" : report.restBalance === "watch" ? "watch rest" : "rest soon"}
        </Chip>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Chip tone="outline">{minutesLabel(report.totalMinutes)} total</Chip>
        <Chip tone="outline">{report.completedQuests} quests</Chip>
        <Chip tone="outline">{report.flowCount} flows</Chip>
        <Chip tone="outline">{report.goalDays} goal days</Chip>
      </div>

      <div className="mt-4 space-y-3">
        {report.subjectMinutes.length === 0 ? (
          <p style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
            Focus blocks with subjects will gather here.
          </p>
        ) : (
          report.subjectMinutes.map((row) => (
            <div key={row.subject?.id ?? "uncategorized"}>
              <div className="mb-1 flex justify-between" style={{ font: "600 12px var(--font-mono)", color: "var(--ink-mut)" }}>
                <span>{row.subject?.name ?? "uncategorized"}</span>
                <span>{minutesLabel(row.minutes)}</span>
              </div>
              <ProgressBar value={(row.minutes / max) * 100} color={row.subject?.color ?? "var(--wisp)"} />
            </div>
          ))
        )}
      </div>

      {report.wins.length > 0 && (
        <div className="mt-4">
          <div className="mb-2" style={{ font: "600 13px var(--font-body)", color: "var(--ink)" }}>Wins you noticed</div>
          <ul className="space-y-1" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
            {report.wins.map((w, i) => (
              <li key={`${w}_${i}`}>· {w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
