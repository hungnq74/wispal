import { describe, expect, it } from "vitest";
import { applyPetActionNeeds, resolvePetAction } from "@/lib/petActions";
import type { PetAction, PetMemoryEvent, PetNeedState } from "@/lib/types";

const needs: PetNeedState = {
  energy: 20,
  playfulness: 50,
  lastFedAt: null,
  lastPettedAt: null,
  lastActionAt: null,
};

const actions: PetAction[] = [
  {
    id: "low",
    trigger: "tap",
    animation: "petReact",
    riveTrigger: "tap",
    label: "low",
    cooldownMs: 1000,
    durationMs: 900,
    energyCost: 0,
    priority: 1,
  },
  {
    id: "high",
    trigger: "tap",
    animation: "jump",
    riveTrigger: "jump",
    label: "high",
    cooldownMs: 1000,
    durationMs: 900,
    energyCost: 5,
    priority: 10,
  },
  {
    id: "bonded",
    trigger: "tap",
    animation: "dance",
    riveTrigger: "dance",
    label: "bonded",
    cooldownMs: 1000,
    durationMs: 900,
    minBondTier: "bonded",
    energyCost: 0,
    priority: 99,
  },
];

describe("pet action resolver", () => {
  it("chooses the highest priority eligible action", () => {
    expect(resolvePetAction({ trigger: "tap", bondTier: "new", needs, memory: [], actions })?.id).toBe("high");
  });

  it("respects bond gates and energy costs", () => {
    expect(resolvePetAction({ trigger: "tap", bondTier: "bonded", needs: { ...needs, energy: 2 }, memory: [], actions })?.id).toBe("bonded");
    expect(resolvePetAction({ trigger: "tap", bondTier: "new", needs: { ...needs, energy: 2 }, memory: [], actions })?.id).toBe("low");
  });

  it("respects cooldowns", () => {
    const memory: PetMemoryEvent[] = [{
      id: "m1",
      actionId: "high",
      trigger: "tap",
      animation: "jump",
      label: "high",
      mood: "idle",
      createdAt: new Date(1000).toISOString(),
    }];
    expect(resolvePetAction({ trigger: "tap", bondTier: "new", needs, memory, actions, now: 1500 })?.id).toBe("low");
  });

  it("gates expression-only shop action packs by owned item", () => {
    const packActions: PetAction[] = [
      ...actions,
      {
        id: "dance-pack",
        trigger: "tap",
        animation: "dance",
        riveTrigger: "dance",
        label: "pack",
        cooldownMs: 0,
        durationMs: 900,
        requiredItemId: "shop_action_dance_pack",
        energyCost: 1,
        priority: 20,
      },
    ];

    expect(resolvePetAction({ trigger: "tap", bondTier: "new", needs, memory: [], actions: packActions })?.id).toBe("high");
    expect(
      resolvePetAction({
        trigger: "tap",
        bondTier: "new",
        needs,
        memory: [],
        actions: packActions,
        ownedItemIds: ["shop_action_dance_pack"],
      })?.id,
    ).toBe("dance-pack");
  });

  it("applies energy and playfulness without leaving bounds", () => {
    const next = applyPetActionNeeds(needs, { ...actions[1], energyDelta: 90, playfulnessDelta: 80 }, 123);
    expect(next.energy).toBe(100);
    expect(next.playfulness).toBe(100);
    expect(next.lastActionAt).toBe(123);
  });
});
