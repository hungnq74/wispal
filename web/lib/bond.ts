import type { BondTier } from "@/lib/types";

/**
 * Bond progression (spec §4). bondPoints is monotonic and NEVER decreases — missing
 * a day costs nothing. Tiers gate warmer dialogue and rarer animations.
 *
 * Tuning goal: a moderately-consistent user reaches "attached" by ~week 3. The big
 * point sources are daily-bounded events (goal hit, reflection, rest), so the curve
 * rewards *consistency*, not volume — you cannot grind your way up faster by stacking
 * more sessions in one day.
 */
export const BOND_THRESHOLDS: Record<BondTier, number> = {
  new: 0,
  familiar: 40,
  trusted: 120,
  attached: 280,
  bonded: 600,
};

const TIER_ORDER: BondTier[] = ["new", "familiar", "trusted", "attached", "bonded"];

export function tierForPoints(points: number): BondTier {
  let tier: BondTier = "new";
  for (const t of TIER_ORDER) {
    if (points >= BOND_THRESHOLDS[t]) tier = t;
  }
  return tier;
}

export function tierRank(tier: BondTier): number {
  return TIER_ORDER.indexOf(tier);
}

/** True if dialogue gated at `min` is unlocked at the companion's current `tier`. */
export function tierAtLeast(tier: BondTier, min: BondTier): boolean {
  return tierRank(tier) >= tierRank(min);
}

/** Progress [0,1] from the current tier's floor toward the next tier's threshold. */
export function tierProgress(points: number): { tier: BondTier; next: BondTier | null; pct: number } {
  const tier = tierForPoints(points);
  const idx = tierRank(tier);
  const next = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
  if (!next) return { tier, next: null, pct: 1 };
  const floor = BOND_THRESHOLDS[tier];
  const ceil = BOND_THRESHOLDS[next];
  return { tier, next, pct: Math.min(1, Math.max(0, (points - floor) / (ceil - floor))) };
}

/**
 * Bond awarded per event. Daily-bounded events (goal/reflection/rest) dominate;
 * session completion is small so repetition can't be farmed.
 */
export const BOND_AWARDS = {
  session_complete: 2,
  flow_detected: 3,
  daily_goal_hit: 5,
  rest: 4, // break taken / fatigue rest accepted
  reflection: 6, // evening reflection submitted — strongest consistency signal
  greeting: 1, // showing up
} as const;
