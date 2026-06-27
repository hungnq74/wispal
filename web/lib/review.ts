import type { ReviewCard } from "@/lib/types";

const BOX_DELAYS_DAYS: Record<ReviewCard["box"], number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

export function nextReviewState(card: ReviewCard, remembered: boolean, now = new Date()) {
  const box = remembered ? (Math.min(5, card.box + 1) as ReviewCard["box"]) : 1;
  const dueAt = new Date(now.getTime() + BOX_DELAYS_DAYS[box] * 86400000).toISOString();
  const bloom = remembered ? Math.min(1, card.bloom + 0.2) : Math.max(0, card.bloom - 0.08);
  return { box, dueAt, bloom };
}

export function dueCards(cards: ReviewCard[], now = new Date()): ReviewCard[] {
  const t = now.toISOString();
  return cards
    .filter((c) => !c.archivedAt && c.dueAt <= t)
    .sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}
