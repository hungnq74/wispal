import { describe, expect, it } from "vitest";
import { dueCards, nextReviewState } from "@/lib/review";
import type { ReviewCard } from "@/lib/types";

const card: ReviewCard = {
  id: "c1",
  deckId: "d1",
  front: "front",
  back: "back",
  box: 2,
  dueAt: "2026-06-24T00:00:00.000Z",
  bloom: 0.4,
  createdAt: "2026-06-20T00:00:00.000Z",
  updatedAt: "2026-06-20T00:00:00.000Z",
};

describe("active recall scheduling", () => {
  it("moves remembered cards forward and blooms them", () => {
    const next = nextReviewState(card, true, new Date("2026-06-24T00:00:00.000Z"));
    expect(next.box).toBe(3);
    expect(next.bloom).toBeCloseTo(0.6);
    expect(next.dueAt).toBe("2026-06-28T00:00:00.000Z");
  });

  it("returns missed cards to box one without punishment", () => {
    const next = nextReviewState(card, false, new Date("2026-06-24T00:00:00.000Z"));
    expect(next.box).toBe(1);
    expect(next.bloom).toBeCloseTo(0.32);
  });

  it("lists due cards only", () => {
    const later = { ...card, id: "later", dueAt: "2026-07-01T00:00:00.000Z" };
    expect(dueCards([later, card], new Date("2026-06-24T12:00:00.000Z")).map((c) => c.id)).toEqual(["c1"]);
  });
});
