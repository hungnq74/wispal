import type {
  BondTier,
  PetAction,
  PetActionTrigger,
  PetMemoryEvent,
  PetNeedState,
} from "@/lib/types";
import { tierAtLeast } from "@/lib/bond";

const LOW = 4_000;
const MID = 12_000;
const HIGH = 30_000;

function petAction(
  action: Omit<PetAction, "durationMs"> & Partial<Pick<PetAction, "durationMs">>,
): PetAction {
  return {
    durationMs: 1200,
    interruptible: true,
    rarity: "common",
    expression: "neutral",
    ...action,
  };
}

export const PET_ACTIONS: PetAction[] = [
  petAction({ id: "idle_blink", trigger: "idle", animation: "blink", riveTrigger: "blink", label: "blinked softly", cooldownMs: LOW, durationMs: 800, targetKind: "center", expression: "neutral", energyCost: 0, playfulnessDelta: 1, priority: 1 }),
  petAction({ id: "idle_look", trigger: "idle", animation: "look", riveTrigger: "look", label: "looked around", cooldownMs: MID, durationMs: 1200, targetKind: "random", expression: "surprised", energyCost: 0, playfulnessDelta: 1, priority: 2 }),
  petAction({ id: "idle_stretch", trigger: "idle", animation: "rest", riveTrigger: "restAccepted", label: "did a tiny stretch", cooldownMs: HIGH, durationMs: 1600, targetKind: "center", expression: "sleepy", energyCost: 0, energyDelta: 2, priority: 3 }),
  petAction({ id: "hover_wave", trigger: "hover", animation: "wave", riveTrigger: "wave", label: "waved hello", cooldownMs: MID, durationMs: 1200, targetKind: "center", expression: "happy", energyCost: 1, playfulnessDelta: 3, priority: 5 }),
  petAction({ id: "tap_wiggle", trigger: "tap", animation: "petReact", riveTrigger: "tap", label: "did a happy wiggle", cooldownMs: LOW, durationMs: 900, targetKind: "center", expression: "surprised", energyCost: 1, playfulnessDelta: 4, priority: 6 }),
  petAction({ id: "tap_pack_spin", trigger: "tap", animation: "dance", riveTrigger: "dance", label: "spun from the poke", cooldownMs: MID, durationMs: 1500, targetKind: "center", expression: "happy", rarity: "rare", requiredItemId: "shop_action_dance_pack", energyCost: 2, playfulnessDelta: 6, priority: 8 }),
  petAction({ id: "pet_purr", trigger: "pet", animation: "petReact", riveTrigger: "pet", label: "leaned into your hand", cooldownMs: MID, durationMs: 1300, targetKind: "center", expression: "happy", energyCost: 0, energyDelta: 2, playfulnessDelta: 5, priority: 7 }),
  petAction({ id: "feed_spark", trigger: "feed", animation: "gift", riveTrigger: "feed", label: "nibbled a spark snack", cooldownMs: HIGH, durationMs: 1500, targetKind: "center", prop: "snack", expression: "happy", energyCost: 0, energyDelta: 14, playfulnessDelta: 3, priority: 8 }),
  petAction({ id: "play_jump", trigger: "play", animation: "jump", riveTrigger: "jump", label: "hopped in place", cooldownMs: MID, durationMs: 1100, targetKind: "random", expression: "happy", energyCost: 6, playfulnessDelta: 8, priority: 7 }),
  petAction({ id: "jump_squeak", trigger: "jump", animation: "jump", riveTrigger: "jump", label: "did a tiny jump", cooldownMs: MID, durationMs: 1000, targetKind: "random", expression: "surprised", energyCost: 4, playfulnessDelta: 5, priority: 7 }),
  petAction({ id: "dance_twirl", trigger: "dance", animation: "dance", riveTrigger: "dance", label: "twirled happily", cooldownMs: HIGH, durationMs: 1700, targetKind: "center", expression: "happy", minBondTier: "familiar", energyCost: 8, playfulnessDelta: 10, priority: 8 }),
  petAction({ id: "dance_pack_shuffle", trigger: "dance", animation: "dance", riveTrigger: "dance", label: "showed off a tiny shuffle", cooldownMs: HIGH, durationMs: 1900, targetKind: "center", expression: "happy", rarity: "rare", minBondTier: "familiar", requiredItemId: "shop_action_dance_pack", energyCost: 8, playfulnessDelta: 12, priority: 13 }),
  petAction({ id: "wave_trust", trigger: "wave", animation: "wave", riveTrigger: "wave", label: "sent a tiny wave", cooldownMs: MID, durationMs: 1200, targetKind: "center", expression: "happy", minBondTier: "trusted", energyCost: 2, playfulnessDelta: 4, priority: 7 }),
  petAction({ id: "study_open_book", trigger: "session_start", animation: "study", riveTrigger: "tap", label: "opened a tiny book", cooldownMs: LOW, durationMs: 1600, targetKind: "center", prop: "book", expression: "focused", interruptible: false, energyCost: 2, priority: 10 }),
  petAction({ id: "study_write", trigger: "session_start", animation: "write", riveTrigger: "tap", label: "started writing beside you", cooldownMs: MID, durationMs: 1500, targetKind: "center", prop: "pencil", expression: "focused", energyCost: 2, priority: 9 }),
  petAction({ id: "study_pack_page_turn", trigger: "session_start", animation: "pageTurn", riveTrigger: "tap", label: "flipped to the next tiny page", cooldownMs: MID, durationMs: 1500, targetKind: "center", prop: "book", expression: "focused", rarity: "rare", requiredItemId: "shop_action_study_pose_pack", energyCost: 2, priority: 12 }),
  petAction({ id: "flow_focus", trigger: "flow_hit", animation: "flow", riveTrigger: "flowHit", label: "locked into flow", cooldownMs: LOW, durationMs: 1800, targetKind: "center", prop: "pencil", expression: "focused", energyCost: 3, playfulnessDelta: 4, priority: 14 }),
  petAction({ id: "complete_jump", trigger: "session_complete", animation: "celebrateSmall", riveTrigger: "celebrate", label: "jumped for your block", cooldownMs: LOW, durationMs: 1700, targetKind: "center", expression: "happy", interruptible: false, energyCost: 4, playfulnessDelta: 6, priority: 15 }),
  petAction({ id: "celebration_pack_star_burst", trigger: "session_complete", animation: "celebrateBig", riveTrigger: "celebrate", label: "burst into little stars", cooldownMs: MID, durationMs: 2200, targetKind: "center", prop: "gift", expression: "happy", rarity: "rare", interruptible: false, requiredItemId: "shop_action_celebration_pack", energyCost: 5, playfulnessDelta: 9, priority: 17 }),
  petAction({ id: "goal_big_dance", trigger: "goal_hit", animation: "celebrateBig", riveTrigger: "goalHit", label: "lit up the room", cooldownMs: HIGH, durationMs: 2300, targetKind: "center", prop: "gift", expression: "happy", rarity: "surprise", interruptible: false, energyCost: 8, playfulnessDelta: 12, priority: 18 }),
  petAction({ id: "celebration_pack_goal_lights", trigger: "goal_hit", animation: "celebrateBig", riveTrigger: "goalHit", label: "called in a roomful of lights", cooldownMs: HIGH, durationMs: 2600, targetKind: "center", prop: "gift", expression: "happy", rarity: "surprise", interruptible: false, requiredItemId: "shop_action_celebration_pack", energyCost: 8, playfulnessDelta: 14, priority: 19 }),
  petAction({ id: "fatigue_blanket", trigger: "fatigue", animation: "tired", riveTrigger: "restAccepted", label: "brought the rest blanket", cooldownMs: MID, durationMs: 1800, targetKind: "lamp", prop: "blanket", expression: "tired", interruptible: false, energyCost: 0, energyDelta: -2, priority: 20 }),
  petAction({ id: "rest_curl", trigger: "rest", animation: "rest", riveTrigger: "restAccepted", label: "curled up to rest", cooldownMs: LOW, durationMs: 1900, targetKind: "decor", prop: "blanket", expression: "sleepy", energyCost: 0, energyDelta: 12, playfulnessDelta: 2, priority: 13 }),
  petAction({ id: "rest_pack_tea", trigger: "rest", animation: "rest", riveTrigger: "restAccepted", label: "made a tiny cup of tea", cooldownMs: MID, durationMs: 2100, targetKind: "lamp", prop: "tea", expression: "sleepy", rarity: "rare", requiredItemId: "shop_action_rest_pose_pack", energyCost: 0, energyDelta: 14, playfulnessDelta: 3, priority: 14 }),
  petAction({ id: "quest_bow", trigger: "quest_done", animation: "jump", riveTrigger: "questDone", label: "bowed for your quest", cooldownMs: MID, durationMs: 1700, targetKind: "quest", expression: "happy", interruptible: false, energyCost: 4, playfulnessDelta: 8, priority: 16 }),
  petAction({ id: "celebration_pack_quest_confetti", trigger: "quest_done", animation: "celebrateSmall", riveTrigger: "questDone", label: "threw tiny quest confetti", cooldownMs: MID, durationMs: 2100, targetKind: "quest", prop: "gift", expression: "happy", rarity: "rare", interruptible: false, requiredItemId: "shop_action_celebration_pack", energyCost: 4, playfulnessDelta: 10, priority: 17 }),
  petAction({ id: "gift_glow", trigger: "gift", animation: "gift", riveTrigger: "giftReceived", label: "handed you a tiny gift", cooldownMs: HIGH, durationMs: 1600, targetKind: "center", prop: "gift", expression: "happy", energyCost: 2, playfulnessDelta: 7, priority: 12 }),
  petAction({ id: "equip_inspect", trigger: "equip", animation: "inspectDecor", riveTrigger: "equipChanged", label: "inspected the new item", cooldownMs: MID, durationMs: 1700, targetKind: "decor", expression: "surprised", energyCost: 2, playfulnessDelta: 5, priority: 11 }),
  petAction({ id: "room_enter_walk", trigger: "room_enter", animation: "walk", riveTrigger: "roomEnter", label: "walked into the room", cooldownMs: MID, durationMs: 1700, targetKind: "random", expression: "neutral", energyCost: 3, priority: 12 }),
  petAction({ id: "decor_visit", trigger: "decor_visit", animation: "inspectDecor", riveTrigger: "equipChanged", label: "visited the decor", cooldownMs: HIGH, durationMs: 1800, targetKind: "decor", expression: "surprised", energyCost: 2, energyDelta: 2, playfulnessDelta: 4, priority: 6 }),
  petAction({ id: "reflection_sleepy_trust", trigger: "reflection", animation: "rest", riveTrigger: "restAccepted", label: "settled after reflection", cooldownMs: HIGH, durationMs: 2100, targetKind: "timer", prop: "tea", expression: "sleepy", minBondTier: "attached", energyCost: 0, energyDelta: 8, priority: 10 }),
];

export function findPetAction(id: string): PetAction | undefined {
  return PET_ACTIONS.find((action) => action.id === id);
}

export function resolvePetAction({
  trigger,
  bondTier,
  needs,
  memory,
  ownedItemIds = [],
  now = Date.now(),
  actions = PET_ACTIONS,
}: {
  trigger: PetActionTrigger;
  bondTier: BondTier;
  needs: PetNeedState;
  memory: PetMemoryEvent[];
  ownedItemIds?: string[];
  now?: number;
  actions?: PetAction[];
}): PetAction | null {
  const eligible = actions
    .filter((action) => action.trigger === trigger)
    .filter((action) => !action.minBondTier || tierAtLeast(bondTier, action.minBondTier))
    .filter((action) => !action.requiredItemId || ownedItemIds.includes(action.requiredItemId))
    .filter((action) => needs.energy >= action.energyCost)
    .filter((action) => {
      const last = memory.find((event) => event.actionId === action.id);
      if (!last) return true;
      return now - new Date(last.createdAt).getTime() >= action.cooldownMs;
    })
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  return eligible[0] ?? null;
}

export function applyPetActionNeeds(needs: PetNeedState, action: PetAction, now = Date.now()): PetNeedState {
  const energy = Math.max(0, Math.min(100, needs.energy - action.energyCost + (action.energyDelta ?? 0)));
  const playfulness = Math.max(0, Math.min(100, needs.playfulness + (action.playfulnessDelta ?? 0)));
  return {
    energy,
    playfulness,
    lastFedAt: action.trigger === "feed" ? now : needs.lastFedAt,
    lastPettedAt: action.trigger === "pet" ? now : needs.lastPettedAt,
    lastActionAt: now,
  };
}
