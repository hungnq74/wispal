/**
 * Soft-currency economy (spec §6). Currency drops on meaningful *moments* — never per
 * minute. The only multiplier is a capped CONSISTENCY (opt-in streak) bonus; there is
 * deliberately NO volume multiplier anywhere (a hard product invariant, spec §10).
 */

export const CURRENCY_AWARDS = {
  session_complete: 10,
  flow_detected: 5,
  daily_goal_hit: 25,
  reflection: 15, // day_closed reflection submitted
  rest: 8, // taking a break / accepting the fatigue rest — resting pays
} as const;

/**
 * Consistency multiplier: rewards showing up on consecutive days, capped so it can't
 * spiral. NOT a function of how much you did in a day — only whether you kept a gentle
 * rhythm. Disabled unless the user opted into streaks.
 */
export function consistencyMultiplier(streaksEnabled: boolean, streakDays: number): number {
  if (!streaksEnabled) return 1;
  const capped = Math.min(Math.max(streakDays, 0), 5);
  return 1 + capped * 0.1; // up to +50% for a 5-day rhythm
}

export function applyConsistency(
  base: number,
  streaksEnabled: boolean,
  streakDays: number,
): number {
  return Math.round(base * consistencyMultiplier(streaksEnabled, streakDays));
}
