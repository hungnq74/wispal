import type {
  UserProfile,
  UserSettings,
  CompanionState,
  PetNeedState,
  WorldState,
  Wallet,
  AmbienceLayerSetting,
  AmbiencePreset,
  FocusGateProfile,
} from "@/lib/types";

export const DEFAULT_COMPANION_PACK = "wisp";
export const DEFAULT_VOICE_PACK = "gentle";
export const DEFAULT_THEME = "tokyo-night";
export const DEFAULT_FOCUS_GATE_PROFILE = "default";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Math.floor(Math.random() * 1e9).toString(36)}_${Date.now().toString(36)}`;
}

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Local date key (YYYY-MM-DD) used to bucket daily logs by the user's own day. */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function defaultSettings(): UserSettings {
  return {
    streaksEnabled: false, // opt-in
    pushEnabled: false,
    dailyGoalMinutes: 90,
    fatigueGuardEnabled: true, // anti-burnout — on by default, not skippable
    preferredSessionLength: 25,
  };
}

export function defaultPetNeeds(): PetNeedState {
  return {
    energy: 78,
    playfulness: 62,
    lastFedAt: null,
    lastPettedAt: null,
    lastActionAt: null,
  };
}

export function defaultProfile(): UserProfile {
  return {
    id: newId(),
    displayName: "friend",
    isGuest: true,
    createdAt: new Date().toISOString(),
    timezone: localTimezone(),
    settings: defaultSettings(),
  };
}

export function defaultCompanion(): CompanionState {
  return {
    packId: DEFAULT_COMPANION_PACK,
    mood: "idle",
    bondPoints: 0,
    bondTier: "new",
    voicePackId: DEFAULT_VOICE_PACK,
    equippedCosmetics: [],
    petNeeds: defaultPetNeeds(),
    petMemory: [],
    activePetActionId: null,
    activePetActionAt: null,
    activePetRuntime: null,
    activePetRoute: null,
    roomX: 0.5,
    lastInteractionAt: Date.now(),
  };
}

export function defaultWorld(): WorldState {
  return {
    themeId: DEFAULT_THEME,
    growthPoints: 0,
    unlockedElements: [],
    decorPlacements: [],
  };
}

export function defaultWallet(): Wallet {
  return { softCurrency: 0 };
}

export function defaultAmbienceLayers(): AmbienceLayerSetting[] {
  return [
    { id: "rain", enabled: false, volume: 0.35 },
    { id: "wind", enabled: false, volume: 0.25 },
    { id: "brownNoise", enabled: false, volume: 0.28 },
    { id: "cafeHum", enabled: false, volume: 0.3 },
  ];
}

export function defaultAmbiencePreset(): AmbiencePreset {
  const now = new Date().toISOString();
  return {
    id: "default-night",
    name: "Quiet night",
    themeId: DEFAULT_THEME,
    muted: true,
    masterVolume: 0.45,
    layers: defaultAmbienceLayers(),
    createdAt: now,
    updatedAt: now,
  };
}

export function defaultFocusGateProfile(): FocusGateProfile {
  return {
    id: DEFAULT_FOCUS_GATE_PROFILE,
    mode: "soft",
    enabled: false,
    activeOnlyDuringSessions: true,
    blocklist: ["youtube.com", "tiktok.com", "instagram.com", "x.com"],
    allowlist: ["docs.google.com", "scholar.google.com"],
    bypassMinutes: 5,
    bypassUntil: null,
    updatedAt: new Date().toISOString(),
  };
}
