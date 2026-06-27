import { describe, expect, it } from "vitest";
import {
  applyDailyRewardClaim,
  applyDailySparkAward,
  MAX_DAILY_EARNED_SPARKS,
  normalizeDailyLog,
} from "@/lib/rewards";
import type { DailyLog } from "@/lib/types";

function log(patch: Partial<DailyLog> = {}): DailyLog {
  return normalizeDailyLog({
    date: "2026-06-27",
    totalActiveMinutes: 0,
    sessionsCompleted: 0,
    goalHit: false,
    reflection: null,
    rewardClaims: [],
    dailyEarnedSparks: 0,
    ...patch,
  });
}

describe("daily reward integrity", () => {
  it("claims a daily reward once", () => {
    const first = applyDailyRewardClaim(log(), "daily_goal", 25);
    expect(first.claimed).toBe(true);
    expect(first.awardedSparks).toBe(25);
    expect(first.log.rewardClaims).toContain("daily_goal");

    const second = applyDailyRewardClaim(first.log, "daily_goal", 25);
    expect(second.claimed).toBe(false);
    expect(second.awardedSparks).toBe(0);
    expect(second.log.dailyEarnedSparks).toBe(25);
  });

  it("caps in-day earned sparks at 100", () => {
    const first = applyDailySparkAward(log({ dailyEarnedSparks: 92 }), 20);
    expect(first.awardedSparks).toBe(8);
    expect(first.log.dailyEarnedSparks).toBe(MAX_DAILY_EARNED_SPARKS);

    const second = applyDailySparkAward(first.log, 10);
    expect(second.awardedSparks).toBe(0);
    expect(second.log.dailyEarnedSparks).toBe(MAX_DAILY_EARNED_SPARKS);
  });

  it("exempts morning gifts from the in-day cap but still claims them once", () => {
    const first = applyDailyRewardClaim(log({ dailyEarnedSparks: 100 }), "morning_gift", 20, {
      exemptFromDailyCap: true,
    });
    expect(first.claimed).toBe(true);
    expect(first.awardedSparks).toBe(20);
    expect(first.log.dailyEarnedSparks).toBe(100);

    const second = applyDailyRewardClaim(first.log, "morning_gift", 20, {
      exemptFromDailyCap: true,
    });
    expect(second.claimed).toBe(false);
    expect(second.awardedSparks).toBe(0);
  });
});
