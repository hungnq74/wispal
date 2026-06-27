"use client";

import { create } from "zustand";
import type {
  UserProfile,
  UserSettings,
  CompanionState,
  CompanionMood,
  PetActionOptions,
  PetActionTrigger,
  PetNeedState,
  PetRouteRuntime,
  PetRuntimeState,
  WorldState,
  Wallet,
  InventoryItem,
  FocusSession,
  DailyLog,
  Reflection,
  DailyRewardClaim,
  SubjectTag,
  Quest,
  AmbiencePreset,
  FocusGateProfile,
  ReviewDeck,
  ReviewCard,
  ReviewEvent,
  DecorPlacement,
  StudyRoom,
  RoomMember,
  RoomSession,
} from "@/lib/types";
import { tierForPoints } from "@/lib/bond";
import { nightUnlocks } from "@/lib/world";
import {
  applyDailyRewardClaim,
  applyDailySparkAward,
  normalizeDailyLog,
} from "@/lib/rewards";
import { nextReviewState } from "@/lib/review";
import {
  applyPetActionNeeds,
  findPetAction,
  resolvePetAction,
} from "@/lib/petActions";
import {
  canStartPetRuntime,
  createPetRouteRuntime,
  createPetRuntime,
} from "@/lib/petStageDirector";
import {
  getDB,
  putProfile,
  putCompanion,
  putWorld,
  putWallet,
  snapshotLocal,
} from "@/lib/db/schema";
import {
  defaultProfile,
  defaultCompanion,
  defaultPetNeeds,
  defaultWorld,
  defaultWallet,
  defaultAmbiencePreset,
  defaultFocusGateProfile,
  defaultSettings,
  newId,
  todayKey,
} from "@/lib/store/defaults";
import { getThemePack } from "@/features/content/loader";

interface WispalState {
  hydrated: boolean;
  profile: UserProfile;
  companion: CompanionState;
  world: WorldState;
  wallet: Wallet;
  inventory: InventoryItem[];
  dailyLogs: Record<string, DailyLog>;
  sessions: FocusSession[];
  subjects: SubjectTag[];
  quests: Quest[];
  ambiencePresets: AmbiencePreset[];
  activeAmbienceId: string;
  focusGateProfiles: FocusGateProfile[];
  activeFocusGateId: string;
  reviewDecks: ReviewDeck[];
  reviewCards: ReviewCard[];
  reviewEvents: ReviewEvent[];
  studyRooms: StudyRoom[];
  roomMembers: RoomMember[];
  roomSessions: RoomSession[];

  // lifecycle
  hydrate: () => Promise<void>;

  // companion
  setMood: (mood: CompanionMood) => void;
  awardBond: (points: number) => void;
  setVoicePack: (voicePackId: string | null) => void;
  setCompanionPack: (packId: string) => void;
  equipCosmetic: (id: string) => void;
  updatePetNeedState: (patch: Partial<PetNeedState>) => void;
  dispatchPetAction: (actionId: string, options?: PetActionOptions) => boolean;
  triggerPetAction: (trigger: PetActionTrigger, options?: PetActionOptions) => boolean;
  startPetRoute: (routeId: string) => boolean;
  advancePetRoute: () => boolean;
  stopPetRoute: () => void;
  completePetRuntime: () => void;
  setPetStageTarget: (x: number, y: number) => void;

  // economy
  addCurrency: (n: number) => void;
  spendCurrency: (n: number) => boolean;
  awardDailySparks: (
    date: string,
    requestedSparks: number,
    options?: { exemptFromDailyCap?: boolean },
  ) => number;
  claimDailyReward: (
    date: string,
    claim: DailyRewardClaim,
    requestedSparks: number,
    options?: { exemptFromDailyCap?: boolean },
  ) => { claimed: boolean; awardedSparks: number; log: DailyLog };

  // world
  addGrowth: (n: number) => void;
  setTheme: (themeId: string) => void;
  placeDecor: (placement: DecorPlacement) => void;
  removeDecor: (placementId: string) => void;

  // inventory
  grantItem: (item: InventoryItem) => void;
  hasItem: (id: string) => boolean;

  // profile / settings
  updateSettings: (patch: Partial<UserSettings>) => void;
  setProfile: (profile: UserProfile) => void;

  // sessions & daily logs
  saveSession: (session: FocusSession) => void;
  upsertDailyLog: (date: string, patch: Partial<DailyLog>) => DailyLog;
  setReflection: (date: string, reflection: Reflection) => void;
  todayLog: () => DailyLog;

  // planner
  createSubject: (input: Pick<SubjectTag, "name" | "color"> & { weeklyTargetMinutes?: number }) => SubjectTag;
  updateSubject: (id: string, patch: Partial<SubjectTag>) => void;
  createQuest: (input: Pick<Quest, "title"> & { subjectId?: string | null; notes?: string }) => Quest;
  updateQuest: (id: string, patch: Partial<Quest>) => void;
  setNextQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  archiveQuest: (id: string) => void;
  nextQuest: () => Quest | null;

  // ambience
  activeAmbience: () => AmbiencePreset;
  setActiveAmbience: (id: string) => void;
  saveAmbiencePreset: (preset: AmbiencePreset) => void;
  updateActiveAmbience: (patch: Partial<AmbiencePreset>) => void;

  // focus gate
  activeFocusGate: () => FocusGateProfile;
  updateFocusGate: (patch: Partial<FocusGateProfile>) => void;

  // review
  createReviewDeck: (input: Pick<ReviewDeck, "name"> & { subjectId?: string | null }) => ReviewDeck;
  createReviewCard: (input: Pick<ReviewCard, "deckId" | "front" | "back">) => ReviewCard;
  updateReviewCard: (id: string, patch: Partial<ReviewCard>) => void;
  recordReview: (cardId: string, remembered: boolean) => ReviewEvent | null;

  // rooms
  saveStudyRoom: (room: StudyRoom) => void;
  saveRoomMember: (member: RoomMember) => void;
  saveRoomSession: (session: RoomSession) => void;
}

function emptyLog(date: string): DailyLog {
  return {
    date,
    totalActiveMinutes: 0,
    sessionsCompleted: 0,
    goalHit: false,
    reflection: null,
    rewardClaims: [],
    dailyEarnedSparks: 0,
  };
}

const COMPANION_MOODS = new Set<CompanionMood>([
  "idle",
  "studying",
  "celebrating",
  "sleepy",
  "tired",
  "resting",
  "greeting",
  "welcomeBack",
]);

const FOCUS_GATE_MODES = new Set(["soft", "strict"]);
const AMBIENCE_LAYER_IDS = new Set(["rain", "wind", "brownNoise", "cafeHum"]);
let petRouteTimer: number | null = null;

function clearPetRouteTimer() {
  if (petRouteTimer === null) return;
  if (typeof window !== "undefined") window.clearTimeout(petRouteTimer);
  petRouteTimer = null;
}

function schedulePetRouteTimer(durationMs: number, advance: () => void) {
  clearPetRouteTimer();
  if (typeof window === "undefined") return;
  petRouteTimer = window.setTimeout(() => {
    petRouteTimer = null;
    advance();
  }, Math.max(120, durationMs));
}

function finiteNumber(
  value: unknown,
  fallback: number,
  options: { min?: number; max?: number; round?: boolean } = {},
): number {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const rounded = options.round ? Math.round(raw) : raw;
  return Math.min(options.max ?? Infinity, Math.max(options.min ?? -Infinity, rounded));
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringArrayOr(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : fallback;
}

function normalizePetRuntime(raw: unknown): PetRuntimeState | null {
  if (!raw || typeof raw !== "object") return null;
  const runtime = raw as Partial<PetRuntimeState>;
  const source = runtime.source === "user" || runtime.source === "decor" ? runtime.source : "system";
  if (typeof runtime.actionId !== "string") return null;
  return {
    actionId: runtime.actionId,
    startedAt: finiteNumber(runtime.startedAt, 0, { min: 0 }),
    endsAt: finiteNumber(runtime.endsAt, 0, { min: 0 }),
    targetX: finiteNumber(runtime.targetX, 0.5, { min: 0, max: 1 }),
    targetY: finiteNumber(runtime.targetY, 0.5, { min: 0, max: 1 }),
    source,
    routeId: typeof runtime.routeId === "string" ? runtime.routeId : undefined,
    routeStepIndex: typeof runtime.routeStepIndex === "number" ? runtime.routeStepIndex : undefined,
    routeTotalSteps: typeof runtime.routeTotalSteps === "number" ? runtime.routeTotalSteps : undefined,
  };
}

function normalizePetRoute(raw: unknown): PetRouteRuntime | null {
  if (!raw || typeof raw !== "object") return null;
  const route = raw as Partial<PetRouteRuntime>;
  if (typeof route.routeId !== "string" || !Array.isArray(route.steps) || route.steps.length === 0) return null;
  const steps = route.steps
    .map((step) => ({
      actionId: typeof step?.actionId === "string" ? step.actionId : "",
      targetX: finiteNumber(step?.targetX, 0.5, { min: 0, max: 1 }),
      targetY: finiteNumber(step?.targetY, 0.5, { min: 0, max: 1 }),
      durationMs: finiteNumber(step?.durationMs, 700, { min: 120, round: true }),
    }))
    .filter((step) => step.actionId);
  if (!steps.length) return null;
  return {
    routeId: route.routeId,
    stepIndex: finiteNumber(route.stepIndex, 0, { min: 0, max: steps.length - 1, round: true }),
    steps,
    startedAt: finiteNumber(route.startedAt, 0, { min: 0 }),
    source: route.source === "system" || route.source === "decor" ? route.source : "user",
  };
}

function normalizeProfile(raw: Partial<UserProfile> | undefined): UserProfile {
  const fallback = defaultProfile();
  const rawSettings =
    raw?.settings && typeof raw.settings === "object"
      ? (raw.settings as Partial<UserSettings>)
      : {};
  const settings = {
    streaksEnabled: booleanOr(rawSettings.streaksEnabled, fallback.settings.streaksEnabled),
    pushEnabled: booleanOr(rawSettings.pushEnabled, fallback.settings.pushEnabled),
    dailyGoalMinutes: finiteNumber(rawSettings.dailyGoalMinutes, fallback.settings.dailyGoalMinutes, {
      min: 1,
      round: true,
    }),
    fatigueGuardEnabled: true,
    preferredSessionLength: finiteNumber(
      rawSettings.preferredSessionLength,
      fallback.settings.preferredSessionLength,
      { min: 1, round: true },
    ),
  };

  return {
    ...fallback,
    ...raw,
    id: stringOr(raw?.id, fallback.id),
    displayName: stringOr(raw?.displayName, fallback.displayName),
    isGuest: booleanOr(raw?.isGuest, fallback.isGuest),
    createdAt: stringOr(raw?.createdAt, fallback.createdAt),
    timezone: stringOr(raw?.timezone, fallback.timezone),
    settings,
  };
}

function normalizeCompanion(raw: Partial<CompanionState> | undefined): CompanionState {
  const fallback = defaultCompanion();
  const bondPoints = finiteNumber(raw?.bondPoints, fallback.bondPoints, { min: 0, round: true });
  const fallbackNeeds = defaultPetNeeds();
  const rawNeeds =
    raw?.petNeeds && typeof raw.petNeeds === "object"
      ? (raw.petNeeds as Partial<PetNeedState>)
      : {};
  const mood =
    typeof raw?.mood === "string" && COMPANION_MOODS.has(raw.mood as CompanionMood)
      ? (raw.mood as CompanionMood)
      : fallback.mood;
  const normalizedRuntime = normalizePetRuntime(raw?.activePetRuntime);
  const activePetRuntime =
    normalizedRuntime && normalizedRuntime.endsAt > Date.now() && !normalizedRuntime.routeId
      ? normalizedRuntime
      : null;

  return {
    ...fallback,
    ...raw,
    packId: stringOr(raw?.packId, fallback.packId),
    mood,
    bondPoints,
    bondTier: tierForPoints(bondPoints),
    voicePackId:
      raw?.voicePackId === null || typeof raw?.voicePackId === "string"
        ? raw.voicePackId
        : fallback.voicePackId,
    equippedCosmetics: stringArrayOr(raw?.equippedCosmetics, fallback.equippedCosmetics),
    petNeeds: {
      energy: finiteNumber(rawNeeds.energy, fallbackNeeds.energy, { min: 0, max: 100 }),
      playfulness: finiteNumber(rawNeeds.playfulness, fallbackNeeds.playfulness, { min: 0, max: 100 }),
      lastFedAt: typeof rawNeeds.lastFedAt === "number" ? rawNeeds.lastFedAt : fallbackNeeds.lastFedAt,
      lastPettedAt:
        typeof rawNeeds.lastPettedAt === "number" ? rawNeeds.lastPettedAt : fallbackNeeds.lastPettedAt,
      lastActionAt:
        typeof rawNeeds.lastActionAt === "number" ? rawNeeds.lastActionAt : fallbackNeeds.lastActionAt,
    },
    petMemory: Array.isArray(raw?.petMemory) ? raw.petMemory.slice(0, 40) : fallback.petMemory,
    activePetActionId:
      typeof raw?.activePetActionId === "string" || raw?.activePetActionId === null
        ? raw.activePetActionId
        : fallback.activePetActionId,
    activePetActionAt:
      typeof raw?.activePetActionAt === "number" || raw?.activePetActionAt === null
        ? raw.activePetActionAt
        : fallback.activePetActionAt,
    activePetRuntime,
    activePetRoute: null,
    roomX: finiteNumber(raw?.roomX, fallback.roomX, { min: 0, max: 1 }),
    lastInteractionAt: finiteNumber(raw?.lastInteractionAt, fallback.lastInteractionAt, { min: 0 }),
  };
}

function normalizeWorld(raw: Partial<WorldState> | undefined): WorldState {
  const fallback = defaultWorld();
  const growthPoints = finiteNumber(raw?.growthPoints, fallback.growthPoints, { min: 0, round: true });
  return {
    ...fallback,
    ...raw,
    themeId: stringOr(raw?.themeId, fallback.themeId),
    growthPoints,
    unlockedElements: stringArrayOr(raw?.unlockedElements, nightUnlocks(growthPoints)),
    decorPlacements: Array.isArray(raw?.decorPlacements) ? raw.decorPlacements : fallback.decorPlacements,
  };
}

function normalizeWallet(raw: Partial<Wallet> | undefined): Wallet {
  const fallback = defaultWallet();
  return {
    softCurrency: finiteNumber(raw?.softCurrency, fallback.softCurrency, { min: 0, round: true }),
  };
}

function withPetRouteStep({
  action,
  companion,
  route,
  runtime,
  now,
}: {
  action: NonNullable<ReturnType<typeof findPetAction>>;
  companion: CompanionState;
  route: PetRouteRuntime;
  runtime: PetRuntimeState;
  now: number;
}): CompanionState {
  return {
    ...companion,
    petNeeds: { ...companion.petNeeds, lastActionAt: now },
    activePetActionId: action.id,
    activePetActionAt: now,
    activePetRuntime: runtime,
    activePetRoute: route,
    roomX: runtime.targetX,
    lastInteractionAt: now,
  };
}

function normalizeAmbiencePreset(raw: Partial<AmbiencePreset> | undefined): AmbiencePreset {
  const fallback = defaultAmbiencePreset();
  const rawLayers = Array.isArray(raw?.layers) ? raw.layers : [];
  const layersById = new Map(
    fallback.layers.map((layer) => [layer.id, layer]),
  );

  for (const layer of rawLayers) {
    if (!layer || typeof layer !== "object" || !AMBIENCE_LAYER_IDS.has(layer.id)) continue;
    const fallbackLayer = layersById.get(layer.id);
    layersById.set(layer.id, {
      id: layer.id,
      enabled: booleanOr(layer.enabled, fallbackLayer?.enabled ?? false),
      volume: finiteNumber(layer.volume, fallbackLayer?.volume ?? 0, { min: 0, max: 1 }),
    });
  }

  return {
    ...fallback,
    ...raw,
    id: stringOr(raw?.id, fallback.id),
    name: stringOr(raw?.name, fallback.name),
    themeId: stringOr(raw?.themeId, fallback.themeId),
    muted: booleanOr(raw?.muted, fallback.muted),
    masterVolume: finiteNumber(raw?.masterVolume, fallback.masterVolume, { min: 0, max: 1 }),
    layers: [...layersById.values()],
    createdAt: stringOr(raw?.createdAt, fallback.createdAt),
    updatedAt: stringOr(raw?.updatedAt, fallback.updatedAt),
  };
}

function normalizeFocusGateProfile(raw: Partial<FocusGateProfile> | undefined): FocusGateProfile {
  const fallback = defaultFocusGateProfile();
  const mode =
    typeof raw?.mode === "string" && FOCUS_GATE_MODES.has(raw.mode)
      ? raw.mode
      : fallback.mode;

  return {
    ...fallback,
    ...raw,
    id: stringOr(raw?.id, fallback.id),
    mode,
    enabled: booleanOr(raw?.enabled, fallback.enabled),
    activeOnlyDuringSessions: booleanOr(
      raw?.activeOnlyDuringSessions,
      fallback.activeOnlyDuringSessions,
    ),
    blocklist: stringArrayOr(raw?.blocklist, fallback.blocklist),
    allowlist: stringArrayOr(raw?.allowlist, fallback.allowlist),
    bypassMinutes: finiteNumber(raw?.bypassMinutes, fallback.bypassMinutes, {
      min: 1,
      max: 30,
      round: true,
    }),
    bypassUntil: typeof raw?.bypassUntil === "number" ? raw.bypassUntil : fallback.bypassUntil,
    updatedAt: stringOr(raw?.updatedAt, fallback.updatedAt),
  };
}

export const useWispalStore = create<WispalState>((set, get) => ({
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

  hydrate: async () => {
    const db = getDB();
    const snap = await snapshotLocal();
    // Normalize legacy local records before they reach render paths.
    const profile = normalizeProfile(snap.profile);
    const companion = normalizeCompanion(snap.companion);
    const world = normalizeWorld(snap.world);
    const wallet = normalizeWallet(snap.wallet);
    const ambiencePresets = snap.ambiencePresets.length
      ? snap.ambiencePresets.map((preset) => normalizeAmbiencePreset(preset))
      : [normalizeAmbiencePreset(undefined)];
    const focusGateProfiles = snap.focusGateProfiles.length
      ? snap.focusGateProfiles.map((gate) => normalizeFocusGateProfile(gate))
      : [normalizeFocusGateProfile(undefined)];
    await Promise.all([
      putProfile(profile),
      putCompanion(companion),
      putWorld(world),
      putWallet(wallet),
      db.ambiencePresets.bulkPut(ambiencePresets),
      db.focusGateProfiles.bulkPut(focusGateProfiles),
    ]);

    const dailyLogs: Record<string, DailyLog> = {};
    for (const log of snap.dailyLogs) dailyLogs[log.date] = normalizeDailyLog(log);
    const sessions = snap.sessions.map((session) => ({ ...session, mode: session.mode ?? ("focus" as const) }));

    set({
      hydrated: true,
      profile,
      companion,
      world,
      wallet,
      inventory: snap.inventory,
      sessions,
      dailyLogs,
      subjects: snap.subjects,
      quests: snap.quests,
      ambiencePresets,
      activeAmbienceId: ambiencePresets[0]?.id ?? "default-night",
      focusGateProfiles,
      activeFocusGateId: focusGateProfiles[0]?.id ?? "default",
      reviewDecks: snap.reviewDecks,
      reviewCards: snap.reviewCards,
      reviewEvents: snap.reviewEvents,
      studyRooms: snap.studyRooms,
      roomMembers: snap.roomMembers,
      roomSessions: snap.roomSessions,
    });
    void db; // keep reference for tree-shaking clarity
  },

  // ── companion ────────────────────────────────────────────────────────────────
  setMood: (mood) => {
    const companion = { ...get().companion, mood, lastInteractionAt: Date.now() };
    set({ companion });
    void putCompanion(companion);
  },

  awardBond: (points) => {
    if (points <= 0) return;
    const prev = get().companion;
    const bondPoints = prev.bondPoints + points; // monotonic — never decreases
    const companion: CompanionState = {
      ...prev,
      bondPoints,
      bondTier: tierForPoints(bondPoints),
    };
    set({ companion });
    void putCompanion(companion);
  },

  setVoicePack: (voicePackId) => {
    const companion = { ...get().companion, voicePackId };
    set({ companion });
    void putCompanion(companion);
  },

  setCompanionPack: (packId) => {
    const companion = { ...get().companion, packId };
    set({ companion });
    void putCompanion(companion);
  },

  equipCosmetic: (id) => {
    const prev = get().companion;
    const equipped = prev.equippedCosmetics.includes(id)
      ? prev.equippedCosmetics.filter((c) => c !== id)
      : [...prev.equippedCosmetics, id];
    const companion = { ...prev, equippedCosmetics: equipped };
    set({ companion });
    void putCompanion(companion);
    get().triggerPetAction("equip", { source: "user" });
  },

  updatePetNeedState: (patch) => {
    const prev = get().companion;
    const companion: CompanionState = {
      ...prev,
      petNeeds: { ...prev.petNeeds, ...patch },
      lastInteractionAt: Date.now(),
    };
    set({ companion });
    void putCompanion(companion);
  },

  dispatchPetAction: (actionId, options = {}) => {
    const action = findPetAction(actionId);
    if (!action) return false;
    const prev = get().companion;
    const now = Date.now();
    const source = options.source ?? "system";
    const currentAction = prev.activePetRuntime ? findPetAction(prev.activePetRuntime.actionId) : null;
    if (!canStartPetRuntime({ action, currentAction, currentRuntime: prev.activePetRuntime, now, source })) {
      return false;
    }
    const activePetRuntime = createPetRuntime({
      action,
      currentRuntime: prev.activePetRuntime,
      decorPlacements: get().world.decorPlacements,
      now,
      options: { ...options, source },
      theme: getThemePack(get().world.themeId),
    });
    const companion: CompanionState = {
      ...prev,
      petNeeds: applyPetActionNeeds(prev.petNeeds, action, now),
      petMemory: [
        {
          id: newId(),
          actionId: action.id,
          trigger: action.trigger,
          animation: action.animation,
          label: action.label,
          mood: prev.mood,
          createdAt: new Date(now).toISOString(),
        },
        ...prev.petMemory,
      ].slice(0, 40),
      activePetActionId: action.id,
      activePetActionAt: now,
      activePetRuntime,
      activePetRoute: options.routeId ? prev.activePetRoute : source === "user" ? null : prev.activePetRoute,
      roomX: activePetRuntime.targetX,
      lastInteractionAt: now,
    };
    set({ companion });
    void putCompanion(companion);
    return true;
  },

  triggerPetAction: (trigger, options = {}) => {
    const companion = get().companion;
    const action = resolvePetAction({
      trigger,
      bondTier: companion.bondTier,
      needs: companion.petNeeds,
      memory: companion.petMemory,
      ownedItemIds: get().inventory.map((item) => item.id),
    });
    return action ? get().dispatchPetAction(action.id, options) : false;
  },

  startPetRoute: (routeId) => {
    const now = Date.now();
    const route = createPetRouteRuntime({ routeId, now, source: "user" });
    if (!route) return false;
    const firstStep = route.steps[0];
    const prev = get().companion;
    const action = findPetAction(firstStep.actionId);
    if (!action) return false;
    const activePetRuntime = createPetRuntime({
      action,
      currentRuntime: prev.activePetRuntime,
      decorPlacements: get().world.decorPlacements,
      now,
      theme: getThemePack(get().world.themeId),
      options: {
        source: route.source,
        targetX: firstStep.targetX,
        targetY: firstStep.targetY,
        durationMs: firstStep.durationMs,
        routeId: route.routeId,
        routeStepIndex: 0,
        routeTotalSteps: route.steps.length,
      },
    });
    const companion = withPetRouteStep({ action, companion: prev, route, runtime: activePetRuntime, now });
    set({ companion });
    void putCompanion(companion);
    schedulePetRouteTimer(firstStep.durationMs, () => get().advancePetRoute());
    return true;
  },

  advancePetRoute: () => {
    const prev = get().companion;
    const route = prev.activePetRoute;
    if (!route) return false;
    const nextStepIndex = route.stepIndex + 1;
    if (nextStepIndex >= route.steps.length) {
      clearPetRouteTimer();
      const companion: CompanionState = {
        ...prev,
        activePetRuntime: null,
        activePetRoute: null,
        lastInteractionAt: Date.now(),
      };
      set({ companion });
      void putCompanion(companion);
      return false;
    }

    const nextRoute: PetRouteRuntime = { ...route, stepIndex: nextStepIndex };
    const nextStep = nextRoute.steps[nextStepIndex];
    const action = findPetAction(nextStep.actionId);
    if (!action) {
      clearPetRouteTimer();
      const companion: CompanionState = {
        ...prev,
        activePetRuntime: null,
        activePetRoute: null,
        lastInteractionAt: Date.now(),
      };
      set({ companion });
      void putCompanion(companion);
      return false;
    }
    const now = Date.now();
    const activePetRuntime = createPetRuntime({
      action,
      currentRuntime: prev.activePetRuntime,
      decorPlacements: get().world.decorPlacements,
      now,
      theme: getThemePack(get().world.themeId),
      options: {
        source: nextRoute.source,
        targetX: nextStep.targetX,
        targetY: nextStep.targetY,
        durationMs: nextStep.durationMs,
        routeId: nextRoute.routeId,
        routeStepIndex: nextStepIndex,
        routeTotalSteps: nextRoute.steps.length,
      },
    });
    const companion = withPetRouteStep({
      action,
      companion: prev,
      route: nextRoute,
      runtime: activePetRuntime,
      now,
    });
    set({ companion });
    void putCompanion(companion);
    schedulePetRouteTimer(nextStep.durationMs, () => get().advancePetRoute());
    return true;
  },

  stopPetRoute: () => {
    const prev = get().companion;
    if (!prev.activePetRoute) return;
    clearPetRouteTimer();
    const companion: CompanionState = { ...prev, activePetRoute: null, lastInteractionAt: Date.now() };
    set({ companion });
    void putCompanion(companion);
  },

  completePetRuntime: () => {
    const prev = get().companion;
    if (!prev.activePetRuntime) return;
    if (prev.activePetRuntime.routeId) clearPetRouteTimer();
    const companion = { ...prev, activePetRuntime: null, activePetRoute: null, lastInteractionAt: Date.now() };
    set({ companion });
    void putCompanion(companion);
  },

  setPetStageTarget: (x, y) => {
    const prev = get().companion;
    const targetX = finiteNumber(x, 0.5, { min: 0, max: 1 });
    const targetY = finiteNumber(y, 0.5, { min: 0, max: 1 });
    const companion: CompanionState = {
      ...prev,
      roomX: targetX,
      activePetRuntime: prev.activePetRuntime
        ? { ...prev.activePetRuntime, targetX, targetY }
        : prev.activePetRuntime,
      lastInteractionAt: Date.now(),
    };
    set({ companion });
    void putCompanion(companion);
  },

  // ── economy ──────────────────────────────────────────────────────────────────
  addCurrency: (n) => {
    if (n <= 0) return;
    const wallet = { softCurrency: get().wallet.softCurrency + n };
    set({ wallet });
    void putWallet(wallet);
  },

  spendCurrency: (n) => {
    const cur = get().wallet.softCurrency;
    if (n <= 0 || cur < n) return false;
    const wallet = { softCurrency: cur - n };
    set({ wallet });
    void putWallet(wallet);
    return true;
  },

  awardDailySparks: (date, requestedSparks, options = {}) => {
    const prev = get().dailyLogs[date] ?? emptyLog(date);
    const result = applyDailySparkAward(prev, requestedSparks, options);
    const log = { ...result.log, date };
    set({
      dailyLogs: { ...get().dailyLogs, [date]: log },
    });
    void getDB().dailyLogs.put(log);
    if (result.awardedSparks > 0) get().addCurrency(result.awardedSparks);
    return result.awardedSparks;
  },

  claimDailyReward: (date, claim, requestedSparks, options = {}) => {
    const prev = get().dailyLogs[date] ?? emptyLog(date);
    const result = applyDailyRewardClaim(prev, claim, requestedSparks, options);
    const log = { ...result.log, date };
    set({
      dailyLogs: { ...get().dailyLogs, [date]: log },
    });
    void getDB().dailyLogs.put(log);
    if (result.awardedSparks > 0) get().addCurrency(result.awardedSparks);
    return { claimed: result.claimed, awardedSparks: result.awardedSparks, log };
  },

  // ── world ────────────────────────────────────────────────────────────────────
  addGrowth: (n) => {
    if (n <= 0) return;
    const prev = get().world;
    const growthPoints = prev.growthPoints + n;
    const world: WorldState = {
      ...prev,
      growthPoints,
      unlockedElements: nightUnlocks(growthPoints),
    };
    set({ world });
    void putWorld(world);
  },

  setTheme: (themeId) => {
    const world = { ...get().world, themeId };
    set({ world });
    void putWorld(world);
    get().triggerPetAction("room_enter", { source: "user" });
  },

  placeDecor: (placement) => {
    const prev = get().world;
    const decorPlacements = [
      ...prev.decorPlacements.filter((d) => d.id !== placement.id),
      placement,
    ];
    const world = { ...prev, decorPlacements };
    set({ world });
    void putWorld(world);
    get().dispatchPetAction("decor_visit", { targetId: placement.id, source: "decor" });
  },

  removeDecor: (placementId) => {
    const prev = get().world;
    const world = {
      ...prev,
      decorPlacements: prev.decorPlacements.filter((d) => d.id !== placementId),
    };
    set({ world });
    void putWorld(world);
  },

  // ── inventory ──────────────────────────────────────────────────────────────────
  grantItem: (item) => {
    if (get().inventory.some((i) => i.id === item.id)) return;
    const inventory = [...get().inventory, item];
    set({ inventory });
    void getDB().inventory.put(item);
  },

  hasItem: (id) => get().inventory.some((i) => i.id === id),

  // ── profile / settings ──────────────────────────────────────────────────────────
  updateSettings: (patch) => {
    const profile = {
      ...get().profile,
      settings: { ...get().profile.settings, ...patch, fatigueGuardEnabled: true },
    };
    set({ profile });
    void putProfile(profile);
  },

  setProfile: (profile) => {
    const next = {
      ...profile,
      settings: { ...defaultSettings(), ...profile.settings, fatigueGuardEnabled: true },
    };
    set({ profile: next });
    void putProfile(next);
  },

  // ── sessions & daily logs ────────────────────────────────────────────────────
  saveSession: (session) => {
    const existing = get().sessions.filter((s) => s.id !== session.id);
    const sessions = [...existing, session];
    set({ sessions });
    void getDB().sessions.put(session);
  },

  upsertDailyLog: (date, patch) => {
    const prev = normalizeDailyLog(get().dailyLogs[date] ?? emptyLog(date));
    const log: DailyLog = normalizeDailyLog({ ...prev, ...patch, date });
    set({ dailyLogs: { ...get().dailyLogs, [date]: log } });
    void getDB().dailyLogs.put(log);
    return log;
  },

  setReflection: (date, reflection) => {
    get().upsertDailyLog(date, { reflection });
  },

  todayLog: () => {
    const date = todayKey();
    return normalizeDailyLog(get().dailyLogs[date] ?? emptyLog(date));
  },

  // ── planner ───────────────────────────────────────────────────────────────────
  createSubject: (input) => {
    const now = new Date().toISOString();
    const subject: SubjectTag = {
      id: newId(),
      name: input.name.trim() || "Untitled subject",
      color: input.color,
      weeklyTargetMinutes: input.weeklyTargetMinutes,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set({ subjects: [...get().subjects, subject] });
    void getDB().subjects.put(subject);
    return subject;
  },

  updateSubject: (id, patch) => {
    const subjects = get().subjects.map((s) =>
      s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s,
    );
    set({ subjects });
    const subject = subjects.find((s) => s.id === id);
    if (subject) void getDB().subjects.put(subject);
  },

  createQuest: (input) => {
    const now = new Date().toISOString();
    const maxOrder = Math.max(0, ...get().quests.map((q) => q.sortOrder));
    const hasNext = get().quests.some((q) => q.status === "next");
    const quest: Quest = {
      id: newId(),
      title: input.title.trim() || "Untitled quest",
      subjectId: input.subjectId ?? null,
      status: hasNext ? "open" : "next",
      sortOrder: maxOrder + 1,
      notes: input.notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      archivedAt: null,
    };
    set({ quests: [...get().quests, quest] });
    void getDB().quests.put(quest);
    return quest;
  },

  updateQuest: (id, patch) => {
    const quests = get().quests.map((q) =>
      q.id === id ? { ...q, ...patch, updatedAt: new Date().toISOString() } : q,
    );
    set({ quests });
    const quest = quests.find((q) => q.id === id);
    if (quest) void getDB().quests.put(quest);
  },

  setNextQuest: (id) => {
    const now = new Date().toISOString();
    const quests = get().quests.map((q) => {
      if (q.status === "done" || q.status === "archived") return q;
      return { ...q, status: (q.id === id ? "next" : "open") as Quest["status"], updatedAt: now };
    });
    set({ quests });
    void getDB().quests.bulkPut(quests);
  },

  completeQuest: (id) => {
    const now = new Date().toISOString();
    get().updateQuest(id, { status: "done", completedAt: now });
    const next = get()
      .quests.filter((q) => q.id !== id && q.status === "open")
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (next) get().setNextQuest(next.id);
  },

  archiveQuest: (id) => {
    const now = new Date().toISOString();
    get().updateQuest(id, { status: "archived", archivedAt: now });
  },

  nextQuest: () =>
    get().quests.find((q) => q.status === "next") ??
    get()
      .quests.filter((q) => q.status === "open")
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ??
    null,

  // ── ambience ─────────────────────────────────────────────────────────────────
  activeAmbience: () =>
    get().ambiencePresets.find((p) => p.id === get().activeAmbienceId) ??
    get().ambiencePresets[0] ??
    defaultAmbiencePreset(),

  setActiveAmbience: (id) => {
    if (!get().ambiencePresets.some((p) => p.id === id)) return;
    set({ activeAmbienceId: id });
  },

  saveAmbiencePreset: (preset) => {
    const updated = { ...preset, updatedAt: new Date().toISOString() };
    const ambiencePresets = [
      ...get().ambiencePresets.filter((p) => p.id !== updated.id),
      updated,
    ];
    set({ ambiencePresets, activeAmbienceId: updated.id });
    void getDB().ambiencePresets.put(updated);
  },

  updateActiveAmbience: (patch) => {
    const active = get().activeAmbience();
    get().saveAmbiencePreset({ ...active, ...patch });
  },

  // ── focus gate ───────────────────────────────────────────────────────────────
  activeFocusGate: () =>
    get().focusGateProfiles.find((p) => p.id === get().activeFocusGateId) ??
    get().focusGateProfiles[0] ??
    defaultFocusGateProfile(),

  updateFocusGate: (patch) => {
    const current = get().activeFocusGate();
    const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
    const focusGateProfiles = [
      ...get().focusGateProfiles.filter((p) => p.id !== updated.id),
      updated,
    ];
    set({ focusGateProfiles, activeFocusGateId: updated.id });
    void getDB().focusGateProfiles.put(updated);
  },

  // ── active recall ────────────────────────────────────────────────────────────
  createReviewDeck: (input) => {
    const now = new Date().toISOString();
    const deck: ReviewDeck = {
      id: newId(),
      name: input.name.trim() || "Untitled deck",
      subjectId: input.subjectId ?? null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set({ reviewDecks: [...get().reviewDecks, deck] });
    void getDB().reviewDecks.put(deck);
    return deck;
  },

  createReviewCard: (input) => {
    const now = new Date().toISOString();
    const card: ReviewCard = {
      id: newId(),
      deckId: input.deckId,
      front: input.front.trim(),
      back: input.back.trim(),
      box: 1,
      dueAt: now,
      bloom: 0,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set({ reviewCards: [...get().reviewCards, card] });
    void getDB().reviewCards.put(card);
    return card;
  },

  updateReviewCard: (id, patch) => {
    const reviewCards = get().reviewCards.map((c) =>
      c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c,
    );
    set({ reviewCards });
    const card = reviewCards.find((c) => c.id === id);
    if (card) void getDB().reviewCards.put(card);
  },

  recordReview: (cardId, remembered) => {
    const card = get().reviewCards.find((c) => c.id === cardId);
    if (!card) return null;
    const now = new Date();
    get().updateReviewCard(cardId, nextReviewState(card, remembered, now));
    const event: ReviewEvent = {
      id: newId(),
      cardId,
      deckId: card.deckId,
      remembered,
      reviewedAt: now.toISOString(),
    };
    set({ reviewEvents: [...get().reviewEvents, event] });
    void getDB().reviewEvents.put(event);
    return event;
  },

  // ── quiet rooms ──────────────────────────────────────────────────────────────
  saveStudyRoom: (room) => {
    set({ studyRooms: [...get().studyRooms.filter((r) => r.id !== room.id), room] });
    void getDB().studyRooms.put(room);
  },

  saveRoomMember: (member) => {
    set({ roomMembers: [...get().roomMembers.filter((m) => m.id !== member.id), member] });
    void getDB().roomMembers.put(member);
  },

  saveRoomSession: (session) => {
    set({ roomSessions: [...get().roomSessions.filter((s) => s.id !== session.id), session] });
    void getDB().roomSessions.put(session);
  },
}));
