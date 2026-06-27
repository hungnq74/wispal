import { describe, it, expect, beforeEach } from "vitest";
import {
  getDB,
  putProfile,
  putCompanion,
  putWorld,
  putWallet,
} from "@/lib/db/schema";
import { buildChangeset } from "@/lib/sync";
import { changesetToRows } from "@/lib/sync/rows";
import type {
  UserProfile,
  CompanionState,
  WorldState,
  Wallet,
  FocusSession,
  DailyLog,
  InventoryItem,
} from "@/lib/types";

/**
 * Guest → account migration is the classic place to silently lose bond + journal data
 * (spec §8). These tests prove the FULL local snapshot survives the trip into a
 * changeset and into owner-stamped rows — nothing is dropped, everything is owner-scoped.
 */

const profile: UserProfile = {
  id: "guest-local-id",
  displayName: "Mai",
  isGuest: true,
  createdAt: "2026-06-01T00:00:00.000Z",
  timezone: "Asia/Ho_Chi_Minh",
  settings: {
    streaksEnabled: true,
    pushEnabled: false,
    dailyGoalMinutes: 90,
    fatigueGuardEnabled: true,
    preferredSessionLength: 25,
  },
};
const companion: CompanionState = {
  packId: "sprout",
  mood: "resting",
  bondPoints: 287, // attached-tier bond we must NOT lose
  bondTier: "attached",
  voicePackId: "gentle",
  equippedCosmetics: ["sunhat"],
  petNeeds: {
    energy: 72,
    playfulness: 64,
    lastFedAt: null,
    lastPettedAt: null,
    lastActionAt: null,
  },
  petMemory: [],
  activePetActionId: null,
  activePetActionAt: null,
  activePetRuntime: null,
  activePetRoute: null,
  roomX: 0.5,
  lastInteractionAt: 1782540000000,
};
const world: WorldState = {
  themeId: "garden",
  growthPoints: 31,
  unlockedElements: ["first-sprout", "lanterns"],
  decorPlacements: [],
};
const wallet: Wallet = { softCurrency: 240 };
const sessions: FocusSession[] = [
  {
    id: "s1",
    userId: "guest-local-id",
    intention: "biology",
    mode: "focus",
    plannedMinutes: 25,
    actualActiveMinutes: 25,
    startedAt: "2026-06-26T09:00:00.000Z",
    endedAt: "2026-06-26T09:25:00.000Z",
    completed: true,
    flowDetected: true,
  },
];
const dailyLogs: DailyLog[] = [
  {
    date: "2026-06-26",
    totalActiveMinutes: 95,
    sessionsCompleted: 3,
    goalHit: true,
    reflection: { mood: 5, win: "finished the chapter", submittedAt: "2026-06-26T22:00:00.000Z" },
    rewardClaims: ["daily_goal", "reflection"],
    dailyEarnedSparks: 52,
  },
];
const inventory: InventoryItem[] = [
  { id: "shop_cosmetic_sunhat", type: "cosmetic", source: "purchased", acquiredAt: "2026-06-20T00:00:00.000Z" },
];

beforeEach(async () => {
  const db = getDB();
  await Promise.all([
    db.profile.clear(),
    db.companion.clear(),
    db.world.clear(),
    db.wallet.clear(),
    db.sessions.clear(),
    db.dailyLogs.clear(),
    db.inventory.clear(),
  ]);
});

async function seedLocal() {
  const db = getDB();
  await putProfile(profile);
  await putCompanion(companion);
  await putWorld(world);
  await putWallet(wallet);
  await db.sessions.bulkPut(sessions);
  await db.dailyLogs.bulkPut(dailyLogs);
  await db.inventory.bulkPut(inventory);
}

describe("guest → account migration carries everything", () => {
  it("buildChangeset captures the full local snapshot (no record dropped)", async () => {
    await seedLocal();
    const cs = await buildChangeset();

    expect(cs.profile?.displayName).toBe("Mai");
    expect(cs.companion?.bondPoints).toBe(287); // bond preserved
    expect(cs.companion?.bondTier).toBe("attached");
    expect(cs.world?.growthPoints).toBe(31);
    expect(cs.wallet?.softCurrency).toBe(240);
    expect(cs.sessions).toHaveLength(1);
    expect(cs.dailyLogs[0].reflection?.win).toBe("finished the chapter"); // journal preserved
    expect(cs.inventory).toHaveLength(1);
    expect(cs.subjects).toEqual([]);
    expect(cs.quests).toEqual([]);
    expect(cs.ambiencePresets).toEqual([]);
    expect(cs.reviewDecks).toEqual([]);
  });

  it("changesetToRows stamps every row with the authenticated owner id", async () => {
    await seedLocal();
    const cs = await buildChangeset();
    const rows = changesetToRows(cs, "auth-user-42");

    // Every owner-scoped row carries the new user id (RLS will enforce it).
    expect(rows.profiles[0].user_id).toBe("auth-user-42");
    expect(rows.companion_state[0].user_id).toBe("auth-user-42");
    expect(rows.world_state[0].user_id).toBe("auth-user-42");
    expect(rows.wallet[0].user_id).toBe("auth-user-42");
    expect(rows.sessions[0].user_id).toBe("auth-user-42");
    expect(rows.daily_logs[0].user_id).toBe("auth-user-42");
    expect(rows.inventory[0].user_id).toBe("auth-user-42");

    // Field mapping camelCase → snake_case is intact (a few representative checks).
    expect(rows.companion_state[0].bond_points).toBe(287);
    expect(rows.companion_state[0].active_pet_runtime).toBeNull();
    expect(rows.companion_state[0].active_pet_route).toBeNull();
    expect(rows.wallet[0].soft_currency).toBe(240);
    expect(rows.daily_logs[0].reflection).toMatchObject({ win: "finished the chapter" });
    expect(rows.daily_logs[0].reward_claims).toEqual(["daily_goal", "reflection"]);
    expect(rows.daily_logs[0].daily_earned_sparks).toBe(52);
    expect(rows.sessions[0].flow_detected).toBe(true);
    expect(rows.sessions[0].mode).toBe("focus");
  });

  it("an empty guest store produces an empty (but valid) changeset — no crash", async () => {
    const cs = await buildChangeset();
    expect(cs.profile).toBeNull();
    expect(cs.sessions).toEqual([]);
    expect(cs.quests).toEqual([]);
    const rows = changesetToRows(cs, "auth-user-42");
    expect(rows.profiles).toEqual([]);
  });
});
