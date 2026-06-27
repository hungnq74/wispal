/**
 * Wispal data model — source of truth (spec §3).
 * Transcribed from the spec; a few additive types (ThemePack, ShopItem, Changeset)
 * are marked clearly and exist only to wire the V1 app together. No behavior here.
 */

// ---------- Core entities ----------

export type ID = string;
export type ISODate = string; // ISO 8601
export type Unix = number; // ms epoch

export interface UserProfile {
  id: ID;
  displayName: string;
  isGuest: boolean;
  createdAt: ISODate;
  timezone: string;
  settings: UserSettings;
}

export interface UserSettings {
  streaksEnabled: boolean; // opt-in, default false
  pushEnabled: boolean; // default false
  dailyGoalMinutes: number; // default 90
  fatigueGuardEnabled: boolean; // default true — anti-burnout
  preferredSessionLength: number; // minutes, default 25
}

export type SessionMode = "focus" | "review" | "room";

// ---------- Companion ----------

export type CompanionMood =
  | "idle" // app open, no session
  | "studying" // active focus block
  | "celebrating" // session/goal completed
  | "sleepy" // user idle mid-session
  | "tired" // fatigue threshold hit → urging rest
  | "resting" // user took a break/ended day
  | "greeting" // first open of the day
  | "welcomeBack"; // returning after a missed day (NO shaming)

export type BondTier = "new" | "familiar" | "trusted" | "attached" | "bonded";

export interface CompanionState {
  packId: ID; // which companion content pack
  mood: CompanionMood;
  bondPoints: number; // monotonic, drives tier
  bondTier: BondTier;
  voicePackId: ID | null;
  equippedCosmetics: ID[]; // outfit/accessory ids
  petNeeds: PetNeedState;
  petMemory: PetMemoryEvent[];
  activePetActionId: ID | null;
  activePetActionAt: Unix | null;
  activePetRuntime: PetRuntimeState | null;
  activePetRoute: PetRouteRuntime | null;
  roomX: number; // 0..1 wandering position inside the companion stage
  lastInteractionAt: Unix;
}

export type PetActionTrigger =
  | "idle"
  | "hover"
  | "tap"
  | "pet"
  | "feed"
  | "play"
  | "dance"
  | "jump"
  | "wave"
  | "session_start"
  | "flow_hit"
  | "session_complete"
  | "goal_hit"
  | "fatigue"
  | "rest"
  | "quest_done"
  | "gift"
  | "equip"
  | "room_enter"
  | "decor_visit"
  | "reflection";

export type PetAnimation =
  | "idle"
  | "blink"
  | "look"
  | "study"
  | "write"
  | "pageTurn"
  | "flow"
  | "sleepy"
  | "tired"
  | "rest"
  | "jump"
  | "dance"
  | "wave"
  | "petReact"
  | "gift"
  | "celebrateSmall"
  | "celebrateBig"
  | "walk"
  | "inspectDecor";

export type PetTargetKind = "center" | "decor" | "lamp" | "pond" | "quest" | "timer" | "random";
export type PetActionRarity = "common" | "rare" | "surprise";
export type PetProp = "book" | "pencil" | "tea" | "blanket" | "gift" | "snack";
export type PetExpression = "neutral" | "happy" | "sleepy" | "surprised" | "focused" | "tired";
export type PetActionSource = "user" | "system" | "decor";

export interface PetAction {
  id: ID;
  trigger: PetActionTrigger;
  animation: PetAnimation;
  riveTrigger: string;
  label: string;
  cooldownMs: number;
  durationMs: number;
  minBondTier?: BondTier;
  requiredItemId?: ID; // optional expression-only shop unlock
  targetKind?: PetTargetKind;
  interruptible?: boolean;
  rarity?: PetActionRarity;
  prop?: PetProp;
  expression?: PetExpression;
  energyCost: number;
  energyDelta?: number;
  playfulnessDelta?: number;
  priority: number;
}

export interface PetNeedState {
  energy: number; // 0..100
  playfulness: number; // 0..100
  lastFedAt: Unix | null;
  lastPettedAt: Unix | null;
  lastActionAt: Unix | null;
}

export interface PetMemoryEvent {
  id: ID;
  actionId: ID;
  trigger: PetActionTrigger;
  animation: PetAnimation;
  label: string;
  mood: CompanionMood;
  createdAt: ISODate;
}

export interface PetRuntimeState {
  actionId: ID;
  startedAt: Unix;
  endsAt: Unix;
  targetX: number; // 0..1 inside the companion stage
  targetY: number; // 0..1 inside the companion stage
  source: PetActionSource;
  routeId?: ID;
  routeStepIndex?: number;
  routeTotalSteps?: number;
}

export interface PetActionOptions {
  targetId?: ID;
  source?: PetActionSource;
  targetX?: number;
  targetY?: number;
  durationMs?: number;
  routeId?: ID;
  routeStepIndex?: number;
  routeTotalSteps?: number;
}

export interface PetRouteStep {
  actionId: ID;
  targetX: number;
  targetY: number;
  durationMs: number;
}

export interface PetRouteRuntime {
  routeId: ID;
  stepIndex: number;
  steps: PetRouteStep[];
  startedAt: Unix;
  source: PetActionSource;
}

// ---------- Sessions & signals ----------

export type FocusSignal =
  | "app_open" // first interaction of a render/day (drives greeting / welcomeBack)
  | "session_start"
  | "heartbeat_active" // user active (tab focused / typing)
  | "heartbeat_idle" // chrome.idle fired
  | "session_complete" // full block finished
  | "session_abandoned" // closed early (NO penalty, just logged)
  | "daily_goal_hit"
  | "flow_detected" // sustained active streak within a block
  | "fatigue_threshold" // cumulative focus today > guard limit
  | "break_started"
  | "day_closed"; // evening reflection submitted

export interface FocusSession {
  id: ID;
  userId: ID;
  intention: string; // 10-sec intention text
  mode: SessionMode;
  questId?: ID;
  subjectId?: ID;
  roomId?: ID;
  plannedMinutes: number;
  actualActiveMinutes: number;
  startedAt: ISODate;
  endedAt: ISODate | null;
  completed: boolean;
  flowDetected: boolean;
}

export interface DailyLog {
  date: ISODate; // local date key
  totalActiveMinutes: number;
  sessionsCompleted: number;
  goalHit: boolean;
  reflection: Reflection | null;
  rewardClaims: DailyRewardClaim[];
  dailyEarnedSparks: number;
}

export interface Reflection {
  // THIS is the "log" — disguised as care
  mood: 1 | 2 | 3 | 4 | 5;
  win: string; // "one thing that went well"
  note?: string; // optional freeform
  submittedAt: ISODate;
}

export type DailyRewardClaim = "daily_goal" | "rest" | "reflection" | "morning_gift";

// ---------- World & economy ----------

export interface WorldState {
  themeId: ID; // active background/music theme
  growthPoints: number; // every completed block adds growth
  unlockedElements: ID[]; // brushstrokes/objects revealed by growth
  decorPlacements: DecorPlacement[];
}

export interface Wallet {
  softCurrency: number; // earned by focusing; spent in shop
}

export interface InventoryItem {
  id: ID;
  type: "companion" | "voicePack" | "cosmetic" | "theme" | "music" | "decor" | "actionPack";
  source: "free" | "earned" | "purchased";
  acquiredAt: ISODate;
}

// ---------- Content packs (data, not code → marketplace-ready) ----------

export interface CompanionPack {
  id: ID;
  name: string;
  riveAsset: string; // animation file ref (V1: SVG state key; URL once on Storage)
  moodMap: Record<CompanionMood, string>; // mood → rive/svg state name
  defaultVoicePackId: ID | null;
  rarity: "common" | "rare" | "event";
}

export interface VoicePack {
  id: ID;
  name: string; // "Sassy", "Anime Hype", "Gentle", "VN-EN"
  locale: string;
  lines: DialogueLine[];
}

export interface DialogueLine {
  trigger: DialogueTrigger; // when to say it
  text: string; // templated, e.g. "Nice, {win} done!"
  audioRef?: string; // pre-rendered TTS clip
  minBondTier?: BondTier; // gate warmer lines behind bond
}

export type DialogueTrigger =
  | "greeting"
  | "session_start"
  | "session_complete"
  | "goal_hit"
  | "flow"
  | "fatigue_rest"
  | "welcome_back"
  | "reflection_prompt"
  | "morning_gift";

// ---------- Additive V1 app types (not in spec §3; wiring only) ----------

/** A world/background+music theme as a content pack (data, not code). */
export type ThemeRenderer = "image" | "pixel";
export type ThemeStyleFamily = "aesthetic" | "pixel";
export type ThemeOverlayProfile = "none" | "stars" | "rain" | "dust" | "fireflies" | "snow";

export interface ScenePoint {
  x: number;
  y: number;
}

export interface ThemeBackgroundStage {
  stage: number;
  minGrowth: number;
  src: string;
  blurSrc: string;
  promptId: string;
}

export interface ThemePetAnchors {
  center: ScenePoint;
  left: ScenePoint;
  right: ScenePoint;
  rest: ScenePoint;
  decor: ScenePoint;
  lamp?: ScenePoint;
  pond?: ScenePoint;
  quest?: ScenePoint;
  timer?: ScenePoint;
}

export interface ThemePack {
  id: ID;
  name: string;
  metaphor: "garden" | "nightSky" | "room" | "island";
  palette: Record<string, string>; // CSS variable overrides
  musicRef: string | null; // ambient loop URL (Supabase Storage), null = built-in
  rarity: "common" | "rare" | "event";
  renderer: ThemeRenderer;
  styleFamily: ThemeStyleFamily;
  backgroundStages: ThemeBackgroundStage[];
  petAnchors: ThemePetAnchors;
  overlayProfile: ThemeOverlayProfile;
}

/** A purchasable/earnable catalogue entry referencing a content pack. */
export interface ShopItem {
  id: ID;
  type: InventoryItem["type"];
  packId: ID; // the content pack this item grants
  name: string;
  description: string;
  price: number; // soft currency
  requiresPlus: boolean; // entitlement seam — gated behind the (stubbed) Plus tier
  rarity: "common" | "rare" | "event";
}

/** One debounced, offline-tolerant sync payload (last-write-wins per record). */
export interface Changeset {
  profile: UserProfile | null;
  companion: CompanionState | null;
  world: WorldState | null;
  wallet: Wallet | null;
  sessions: FocusSession[];
  dailyLogs: DailyLog[];
  inventory: InventoryItem[];
  subjects: SubjectTag[];
  quests: Quest[];
  ambiencePresets: AmbiencePreset[];
  focusGateProfiles: FocusGateProfile[];
  reviewDecks: ReviewDeck[];
  reviewCards: ReviewCard[];
  reviewEvents: ReviewEvent[];
  studyRooms: StudyRoom[];
  roomMembers: RoomMember[];
  roomSessions: RoomSession[];
  clientUpdatedAt: Unix;
}

// ---------- Phase 1: planner, reports, ambience ----------

export interface SubjectTag {
  id: ID;
  name: string;
  color: string;
  weeklyTargetMinutes?: number;
  archivedAt?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type QuestStatus = "open" | "next" | "done" | "archived";

export interface Quest {
  id: ID;
  title: string;
  subjectId?: ID | null;
  status: QuestStatus;
  sortOrder: number;
  notes?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
  completedAt?: ISODate | null;
  archivedAt?: ISODate | null;
}

export type AmbienceLayerId = "rain" | "wind" | "brownNoise" | "cafeHum";

export interface AmbienceLayerSetting {
  id: AmbienceLayerId;
  enabled: boolean;
  volume: number; // 0..1
}

export interface AmbiencePreset {
  id: ID;
  name: string;
  themeId: ID;
  muted: boolean;
  masterVolume: number; // 0..1
  layers: AmbienceLayerSetting[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ---------- Phase 2: focus gate, recall, decor ----------

export type FocusGateMode = "soft" | "strict";

export interface FocusGateProfile {
  id: ID;
  mode: FocusGateMode;
  enabled: boolean;
  activeOnlyDuringSessions: boolean;
  blocklist: string[];
  allowlist: string[];
  bypassMinutes: number;
  bypassUntil?: Unix | null;
  updatedAt: ISODate;
}

export interface ReviewDeck {
  id: ID;
  name: string;
  subjectId?: ID | null;
  archivedAt?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ReviewCard {
  id: ID;
  deckId: ID;
  front: string;
  back: string;
  box: 1 | 2 | 3 | 4 | 5;
  dueAt: ISODate;
  bloom: number; // 0..1
  archivedAt?: ISODate | null;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ReviewEvent {
  id: ID;
  cardId: ID;
  deckId: ID;
  remembered: boolean;
  reviewedAt: ISODate;
}

export interface DecorPlacement {
  id: ID;
  itemId: ID;
  x: number; // 0..1
  y: number; // 0..1
  scale: number;
  placedAt: ISODate;
}

// ---------- Phase 3: quiet rooms ----------

export type RoomVisibility = "invite";
export type RoomPhase = "idle" | "focus" | "break";

export interface StudyRoom {
  id: ID;
  name: string;
  hostUserId: ID;
  inviteCode: string;
  visibility: RoomVisibility;
  subjectId?: ID | null;
  plannedMinutes: number;
  breakMinutes: number;
  cohortLabel?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  archivedAt?: ISODate | null;
}

export interface RoomMember {
  id: ID;
  roomId: ID;
  userId: ID;
  displayAlias: string;
  role: "host" | "member";
  joinedAt: ISODate;
}

export interface RoomSession {
  id: ID;
  roomId: ID;
  hostUserId: ID;
  phase: RoomPhase;
  startedAt: ISODate;
  plannedMinutes: number;
  endedAt?: ISODate | null;
}
