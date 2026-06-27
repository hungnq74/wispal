import type { DailyLog, FocusSession, Quest, SubjectTag } from "@/lib/types";

export interface WeeklyReport {
  start: string;
  end: string;
  totalMinutes: number;
  focusMinutes: number;
  reviewMinutes: number;
  roomMinutes: number;
  completedQuests: number;
  flowCount: number;
  goalDays: number;
  restBalance: "gentle" | "watch" | "overworked";
  subjectMinutes: Array<{ subject: SubjectTag | null; minutes: number }>;
  wins: string[];
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function weekBounds(now = new Date()): { start: string; end: string } {
  const start = new Date(now);
  const day = (start.getDay() + 6) % 7; // Monday = 0
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: dateKey(start), end: dateKey(end) };
}

export function buildWeeklyReport(input: {
  dailyLogs: Record<string, DailyLog>;
  sessions: FocusSession[];
  subjects: SubjectTag[];
  quests: Quest[];
  now?: Date;
}): WeeklyReport {
  const { start, end } = weekBounds(input.now);
  const logs = Object.values(input.dailyLogs).filter((l) => l.date >= start && l.date <= end);
  const sessions = input.sessions.filter((s) => {
    const key = s.startedAt.slice(0, 10);
    return key >= start && key <= end;
  });
  const subjectById = new Map(input.subjects.map((s) => [s.id, s]));
  const minutesBySubject = new Map<string, number>();
  let uncategorized = 0;
  let focusMinutes = 0;
  let reviewMinutes = 0;
  let roomMinutes = 0;

  for (const s of sessions) {
    const minutes = s.actualActiveMinutes;
    if (s.mode === "review") reviewMinutes += minutes;
    else if (s.mode === "room") roomMinutes += minutes;
    else focusMinutes += minutes;

    if (s.subjectId) minutesBySubject.set(s.subjectId, (minutesBySubject.get(s.subjectId) ?? 0) + minutes);
    else uncategorized += minutes;
  }

  const totalMinutes = focusMinutes + reviewMinutes + roomMinutes;
  const subjectMinutes = [
    ...Array.from(minutesBySubject.entries()).map(([id, minutes]) => ({
      subject: subjectById.get(id) ?? null,
      minutes,
    })),
    ...(uncategorized ? [{ subject: null, minutes: uncategorized }] : []),
  ].sort((a, b) => b.minutes - a.minutes);

  const completedQuests = input.quests.filter(
    (q) => q.completedAt && q.completedAt.slice(0, 10) >= start && q.completedAt.slice(0, 10) <= end,
  ).length;
  const goalDays = logs.filter((l) => l.goalHit).length;
  const flowCount = sessions.filter((s) => s.flowDetected).length;
  const wins = logs
    .filter((l) => l.reflection?.win)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((l) => l.reflection!.win)
    .slice(0, 4);

  const restBalance =
    totalMinutes >= 900 || logs.some((l) => l.totalActiveMinutes >= 180)
      ? "overworked"
      : totalMinutes >= 600
        ? "watch"
        : "gentle";

  return {
    start,
    end,
    totalMinutes,
    focusMinutes,
    reviewMinutes,
    roomMinutes,
    completedQuests,
    flowCount,
    goalDays,
    restBalance,
    subjectMinutes,
    wins,
  };
}
