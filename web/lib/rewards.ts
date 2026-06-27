import type { DailyLog, DailyRewardClaim } from "@/lib/types";

export const MAX_DAILY_EARNED_SPARKS = 100;
export const MIN_REWARDED_SESSION_MINUTES = 10;

export interface DailySparkAward {
  awardedSparks: number;
  log: DailyLog;
}

export interface DailyRewardClaimResult extends DailySparkAward {
  claimed: boolean;
}

export function normalizeDailyLog(log: DailyLog): DailyLog {
  return {
    ...log,
    rewardClaims: log.rewardClaims ?? [],
    dailyEarnedSparks: log.dailyEarnedSparks ?? 0,
  };
}

export function hasRewardClaim(log: DailyLog, claim: DailyRewardClaim): boolean {
  return normalizeDailyLog(log).rewardClaims.includes(claim);
}

export function applyDailySparkAward(
  log: DailyLog,
  requestedSparks: number,
  options: { exemptFromDailyCap?: boolean } = {},
): DailySparkAward {
  const current = normalizeDailyLog(log);
  const requested = Math.max(0, Math.round(requestedSparks));
  if (options.exemptFromDailyCap) {
    return { awardedSparks: requested, log: current };
  }

  const remaining = Math.max(0, MAX_DAILY_EARNED_SPARKS - current.dailyEarnedSparks);
  const awardedSparks = Math.min(requested, remaining);
  return {
    awardedSparks,
    log: {
      ...current,
      dailyEarnedSparks: current.dailyEarnedSparks + awardedSparks,
    },
  };
}

export function applyDailyRewardClaim(
  log: DailyLog,
  claim: DailyRewardClaim,
  requestedSparks: number,
  options: { exemptFromDailyCap?: boolean } = {},
): DailyRewardClaimResult {
  const current = normalizeDailyLog(log);
  if (current.rewardClaims.includes(claim)) {
    return { claimed: false, awardedSparks: 0, log: current };
  }

  const awarded = applyDailySparkAward(current, requestedSparks, options);
  return {
    claimed: true,
    awardedSparks: awarded.awardedSparks,
    log: {
      ...awarded.log,
      rewardClaims: [...current.rewardClaims, claim],
    },
  };
}
