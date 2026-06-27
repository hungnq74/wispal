import type { DailyLog } from "@/lib/types";
import { todayKey } from "@/lib/store/defaults";

/** Days between two YYYY-MM-DD keys (b - a), via UTC noon to dodge DST edges. */
export function dayDiff(a: string, b: string): number {
  const pa = Date.parse(`${a}T12:00:00Z`);
  const pb = Date.parse(`${b}T12:00:00Z`);
  return Math.round((pb - pa) / 86_400_000);
}

function shiftKey(key: string, deltaDays: number): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return key && `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isActive(log: DailyLog | undefined): boolean {
  return !!log && (log.totalActiveMinutes > 0 || log.sessionsCompleted > 0 || !!log.reflection);
}

function lastActiveKey(logs: Record<string, DailyLog>): string | null {
  const keys = Object.values(logs)
    .filter(isActive)
    .map((l) => l.date)
    .sort();
  return keys.length ? keys[keys.length - 1] : null;
}

/**
 * Did the user miss a day? True only if they have prior activity AND the most recent
 * active day is more than one day before today (a real gap). Drives welcomeBack —
 * which carries ZERO shame and never costs progress (spec §10).
 */
export function missedDay(logs: Record<string, DailyLog>, today: string = todayKey()): boolean {
  const last = lastActiveKey(logs);
  if (!last) return false;
  return dayDiff(last, today) > 1;
}

/**
 * Current consecutive-day streak ending today (or yesterday if today isn't active yet).
 * Used only for the opt-in CONSISTENCY currency bonus — never for ranking.
 */
export function currentStreak(logs: Record<string, DailyLog>, today: string = todayKey()): number {
  let streak = 0;
  let cursor = isActive(logs[today]) ? today : shiftKey(today, -1);
  while (isActive(logs[cursor])) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}
