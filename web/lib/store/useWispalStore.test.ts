import { beforeEach, describe, expect, it } from "vitest";
import { SINGLETON_KEY, getDB } from "@/lib/db/schema";
import { tierForPoints } from "@/lib/bond";
import { getPetRoute } from "@/lib/petStageDirector";
import { useWispalStore } from "@/lib/store/useWispalStore";
import {
  defaultAmbiencePreset,
  defaultCompanion,
  defaultFocusGateProfile,
  defaultPetNeeds,
  defaultProfile,
  defaultWallet,
  defaultWorld,
} from "@/lib/store/defaults";
import type {
  AmbiencePreset,
  CompanionState,
  FocusGateProfile,
  UserProfile,
  Wallet,
  WorldState,
} from "@/lib/types";

function resetStore() {
  useWispalStore.setState({
    hydrated: false,
    profile: defaultProfile(),
    companion: defaultCompanion(),
    world: defaultWorld(),
    wallet: defaultWallet(),
    inventory: [],
    dailyLogs: {},
    sessions: [],
    subjects: [],
    quests: [],
    ambiencePresets: [defaultAmbiencePreset()],
    activeAmbienceId: "default-night",
    focusGateProfiles: [defaultFocusGateProfile()],
    activeFocusGateId: "default",
    reviewDecks: [],
    reviewCards: [],
    reviewEvents: [],
    studyRooms: [],
    roomMembers: [],
    roomSessions: [],
  });
}

beforeEach(async () => {
  const db = getDB();
  await Promise.all(db.tables.map((table) => table.clear()));
  resetStore();
});

describe("useWispalStore hydration", () => {
  it("normalizes legacy local records before they reach render paths", async () => {
    const db = getDB();
    await db.profile.put(
      {
        id: "legacy-user",
        displayName: "Mai",
        isGuest: true,
        createdAt: "2026-06-01T00:00:00.000Z",
        timezone: "Asia/Ho_Chi_Minh",
      } as UserProfile,
      SINGLETON_KEY,
    );
    await db.companion.put(
      {
        packId: "wisp",
        mood: "idle",
        bondPoints: 42,
        bondTier: "new",
        voicePackId: null,
        lastInteractionAt: 1782540000000,
      } as CompanionState,
      SINGLETON_KEY,
    );
    await db.world.put(
      {
        themeId: "tokyo-night",
        growthPoints: 3,
        unlockedElements: ["first-star"],
        decorPlacements: null,
      } as unknown as WorldState,
      SINGLETON_KEY,
    );
    await db.wallet.put({} as Wallet, SINGLETON_KEY);
    await db.ambiencePresets.put({
      id: "legacy-preset",
      name: "Legacy preset",
      themeId: "tokyo-night",
    } as AmbiencePreset);
    await db.focusGateProfiles.put({
      id: "legacy-gate",
      mode: "strict",
      enabled: true,
    } as FocusGateProfile);

    await expect(useWispalStore.getState().hydrate()).resolves.toBeUndefined();

    const state = useWispalStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.profile.settings).toMatchObject({
      dailyGoalMinutes: 90,
      fatigueGuardEnabled: true,
      preferredSessionLength: 25,
    });
    expect(state.companion.bondTier).toBe(tierForPoints(42));
    expect(state.companion.equippedCosmetics).toEqual([]);
    expect(state.companion.petNeeds).toEqual(defaultPetNeeds());
    expect(state.companion.petMemory).toEqual([]);
    expect(state.companion.activePetRuntime).toBeNull();
    expect(state.companion.activePetRoute).toBeNull();
    expect(state.companion.roomX).toBe(0.5);
    expect(state.companion.voicePackId).toBeNull();
    expect(state.world.decorPlacements).toEqual([]);
    expect(state.wallet.softCurrency).toBe(0);
    expect(state.ambiencePresets[0].layers).toHaveLength(defaultAmbiencePreset().layers.length);
    expect(state.focusGateProfiles[0].blocklist).toEqual(defaultFocusGateProfile().blocklist);
  });

  it("runs a route by advancing through named waypoints", () => {
    const route = getPetRoute("showtime");
    expect(route).not.toBeNull();

    expect(useWispalStore.getState().startPetRoute("showtime")).toBe(true);
    let companion = useWispalStore.getState().companion;
    expect(companion.activePetRoute).toMatchObject({ routeId: "showtime", stepIndex: 0 });
    expect(companion.activePetRuntime).toMatchObject({
      actionId: "room_enter_walk",
      routeId: "showtime",
      routeStepIndex: 0,
      targetX: 0.23,
      targetY: 0.64,
    });

    for (let stepIndex = 1; stepIndex < route!.length; stepIndex += 1) {
      expect(useWispalStore.getState().advancePetRoute()).toBe(true);
      companion = useWispalStore.getState().companion;
      expect(companion.activePetRoute).toMatchObject({ routeId: "showtime", stepIndex });
      expect(companion.activePetRuntime).toMatchObject({
        actionId: route![stepIndex].actionId,
        routeStepIndex: stepIndex,
        routeTotalSteps: route!.length,
        targetX: route![stepIndex].targetX,
        targetY: route![stepIndex].targetY,
      });
    }

    expect(useWispalStore.getState().advancePetRoute()).toBe(false);
    companion = useWispalStore.getState().companion;
    expect(companion.activePetRoute).toBeNull();
    expect(companion.activePetRuntime).toBeNull();
  });
});

describe("useWispalStore pet movement", () => {
  it("moves toward decor and returns to center for study actions", () => {
    useWispalStore.setState({
      companion: { ...defaultCompanion(), roomX: 0.2 },
      world: {
        ...defaultWorld(),
        decorPlacements: [
          {
            id: "decor-old",
            itemId: "decor_lantern",
            x: 0.24,
            y: 0.2,
            scale: 1,
            placedAt: "2026-06-20T00:00:00.000Z",
          },
          {
            id: "decor-new",
            itemId: "decor_cushion",
            x: 0.82,
            y: 0.4,
            scale: 1,
            placedAt: "2026-06-21T00:00:00.000Z",
          },
        ],
      },
    });

    expect(useWispalStore.getState().dispatchPetAction("decor_visit")).toBe(true);
    expect(useWispalStore.getState().companion.roomX).toBeCloseTo(0.7304);
    expect(useWispalStore.getState().companion.activePetRuntime).toMatchObject({
      actionId: "decor_visit",
      source: "system",
      targetX: expect.any(Number),
      targetY: expect.any(Number),
    });

    expect(useWispalStore.getState().dispatchPetAction("study_open_book")).toBe(true);
    expect(useWispalStore.getState().companion.roomX).toBe(0.5);
    expect(useWispalStore.getState().companion.activePetRuntime).toMatchObject({
      actionId: "study_open_book",
      targetX: 0.5,
      targetY: 0.5,
    });
  });
});
