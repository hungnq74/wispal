/**
 * Night-sky world model (pure). The world grows one "growth point" per completed block
 * (spec §4) — you paint stars into the night. Two things scale with growth:
 *  1. Milestone elements that unlock at thresholds (pines, moon, pond, lanterns, …).
 *  2. A continuous count of stars that fill the sky — so a fresh night and a 20-session
 *     night look visibly different (acceptance criteria §10).
 * Placement is deterministic (seeded by index), so the scene is stable across reloads.
 */

export interface NightMilestone {
  id: string;
  at: number; // growthPoints required
  label: string;
}

export const NIGHT_MILESTONES: NightMilestone[] = [
  { id: "first-star", at: 1, label: "First star" },
  { id: "constellation", at: 3, label: "Constellation" },
  { id: "pines", at: 6, label: "Pine grove" },
  { id: "moon", at: 10, label: "Crescent moon" },
  { id: "pond", at: 15, label: "Still pond" },
  { id: "fireflies", at: 22, label: "Fireflies" },
  { id: "lanterns", at: 30, label: "Lanterns" },
  { id: "shooting-star", at: 45, label: "Shooting star" },
  { id: "aurora", at: 60, label: "Aurora" },
];

/** Milestone element ids unlocked at the given growth. */
export function nightUnlocks(growthPoints: number): string[] {
  return NIGHT_MILESTONES.filter((m) => growthPoints >= m.at).map((m) => m.id);
}

/** The next milestone still to come (for gentle "almost there" hints), or null. */
export function nextMilestone(growthPoints: number): NightMilestone | null {
  return NIGHT_MILESTONES.find((m) => growthPoints < m.at) ?? null;
}

/** Number of stars painted into the sky — saturates so it never becomes cluttered. */
export function starCount(growthPoints: number): number {
  return Math.min(90, 6 + growthPoints * 3);
}

/** Deterministic pseudo-random in [0,1) seeded by an integer (stable placement). */
export function seeded(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
