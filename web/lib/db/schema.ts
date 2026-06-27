import Dexie, { type Table } from "dexie";
import type {
  UserProfile,
  CompanionState,
  WorldState,
  Wallet,
  FocusSession,
  DailyLog,
  InventoryItem,
  Changeset,
  SubjectTag,
  Quest,
  AmbiencePreset,
  FocusGateProfile,
  ReviewDeck,
  ReviewCard,
  ReviewEvent,
  StudyRoom,
  RoomMember,
  RoomSession,
} from "@/lib/types";

/**
 * Local-first store (spec §8). Every write hits IndexedDB immediately; the UI never
 * blocks on the network. Singletons (profile/companion/world/wallet) use Dexie
 * "outbound" keys under a constant key; collections are keyed by their natural id.
 */

export const SINGLETON_KEY = "me" as const;

/** A queued, debounced changeset awaiting sync (offline-tolerant). */
export interface SyncQueueEntry {
  seq?: number;
  changeset: Changeset;
  queuedAt: number;
}

export class WispalDB extends Dexie {
  // Singletons (outbound key = SINGLETON_KEY)
  profile!: Table<UserProfile, string>;
  companion!: Table<CompanionState, string>;
  world!: Table<WorldState, string>;
  wallet!: Table<Wallet, string>;

  // Collections (inline keys)
  sessions!: Table<FocusSession, string>;
  dailyLogs!: Table<DailyLog, string>;
  inventory!: Table<InventoryItem, string>;
  subjects!: Table<SubjectTag, string>;
  quests!: Table<Quest, string>;
  ambiencePresets!: Table<AmbiencePreset, string>;
  focusGateProfiles!: Table<FocusGateProfile, string>;
  reviewDecks!: Table<ReviewDeck, string>;
  reviewCards!: Table<ReviewCard, string>;
  reviewEvents!: Table<ReviewEvent, string>;
  studyRooms!: Table<StudyRoom, string>;
  roomMembers!: Table<RoomMember, string>;
  roomSessions!: Table<RoomSession, string>;

  // Sync outbox
  syncQueue!: Table<SyncQueueEntry, number>;

  constructor() {
    super("wispal");
    this.version(1).stores({
      // "" → outbound primary key (provided as the 2nd arg to put/get)
      profile: "",
      companion: "",
      world: "",
      wallet: "",
      // inline keys; secondary index on startedAt/date for ordering
      sessions: "&id, startedAt",
      dailyLogs: "&date",
      inventory: "&id",
      syncQueue: "++seq, queuedAt",
    });
    this.version(2)
      .stores({
        profile: "",
        companion: "",
        world: "",
        wallet: "",
        sessions: "&id, startedAt, mode, questId, subjectId, roomId",
        dailyLogs: "&date",
        inventory: "&id, type",
        subjects: "&id, name, archivedAt",
        quests: "&id, status, sortOrder, subjectId, updatedAt",
        ambiencePresets: "&id, updatedAt",
        focusGateProfiles: "&id, updatedAt",
        reviewDecks: "&id, subjectId, archivedAt",
        reviewCards: "&id, deckId, dueAt, archivedAt",
        reviewEvents: "&id, cardId, deckId, reviewedAt",
        studyRooms: "&id, inviteCode, hostUserId, archivedAt",
        roomMembers: "&id, roomId, userId",
        roomSessions: "&id, roomId, startedAt",
        syncQueue: "++seq, queuedAt",
      })
      .upgrade(async (tx) => {
        await tx.table("sessions").toCollection().modify((session: Partial<FocusSession>) => {
          session.mode ??= "focus";
        });
        await tx.table("world").toCollection().modify((world: Partial<WorldState>) => {
          world.decorPlacements ??= [];
        });
      });
    this.version(3)
      .stores({
        profile: "",
        companion: "",
        world: "",
        wallet: "",
        sessions: "&id, startedAt, mode, questId, subjectId, roomId",
        dailyLogs: "&date",
        inventory: "&id, type",
        subjects: "&id, name, archivedAt",
        quests: "&id, status, sortOrder, subjectId, updatedAt",
        ambiencePresets: "&id, updatedAt",
        focusGateProfiles: "&id, updatedAt",
        reviewDecks: "&id, subjectId, archivedAt",
        reviewCards: "&id, deckId, dueAt, archivedAt",
        reviewEvents: "&id, cardId, deckId, reviewedAt",
        studyRooms: "&id, inviteCode, hostUserId, archivedAt",
        roomMembers: "&id, roomId, userId",
        roomSessions: "&id, roomId, startedAt",
        syncQueue: "++seq, queuedAt",
      })
      .upgrade(async (tx) => {
        await tx.table("dailyLogs").toCollection().modify((log: Partial<DailyLog>) => {
          log.rewardClaims ??= [];
          log.dailyEarnedSparks ??= 0;
        });
      });
  }
}

/**
 * Lazily-created singleton DB. Guarded so it is only constructed in the browser —
 * importing this module on the server (RSC / API routes) must not touch IndexedDB.
 */
let _db: WispalDB | null = null;
export function getDB(): WispalDB {
  if (typeof indexedDB === "undefined") {
    throw new Error("Wispal DB accessed outside the browser");
  }
  if (!_db) _db = new WispalDB();
  return _db;
}

// ── Singleton helpers ──────────────────────────────────────────────────────────
export async function getProfile() {
  return getDB().profile.get(SINGLETON_KEY);
}
export async function putProfile(p: UserProfile) {
  return getDB().profile.put(p, SINGLETON_KEY);
}
export async function getCompanion() {
  return getDB().companion.get(SINGLETON_KEY);
}
export async function putCompanion(c: CompanionState) {
  return getDB().companion.put(c, SINGLETON_KEY);
}
export async function getWorld() {
  return getDB().world.get(SINGLETON_KEY);
}
export async function putWorld(w: WorldState) {
  return getDB().world.put(w, SINGLETON_KEY);
}
export async function getWallet() {
  return getDB().wallet.get(SINGLETON_KEY);
}
export async function putWallet(w: Wallet) {
  return getDB().wallet.put(w, SINGLETON_KEY);
}

/** Read the entire local store as one changeset (used for sync + account migration). */
export async function snapshotLocal(): Promise<{
  profile: UserProfile | undefined;
  companion: CompanionState | undefined;
  world: WorldState | undefined;
  wallet: Wallet | undefined;
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
}> {
  const db = getDB();
  const [
    profile,
    companion,
    world,
    wallet,
    sessions,
    dailyLogs,
    inventory,
    subjects,
    quests,
    ambiencePresets,
    focusGateProfiles,
    reviewDecks,
    reviewCards,
    reviewEvents,
    studyRooms,
    roomMembers,
    roomSessions,
  ] =
    await Promise.all([
      db.profile.get(SINGLETON_KEY),
      db.companion.get(SINGLETON_KEY),
      db.world.get(SINGLETON_KEY),
      db.wallet.get(SINGLETON_KEY),
      db.sessions.toArray(),
      db.dailyLogs.toArray(),
      db.inventory.toArray(),
      db.subjects.toArray(),
      db.quests.toArray(),
      db.ambiencePresets.toArray(),
      db.focusGateProfiles.toArray(),
      db.reviewDecks.toArray(),
      db.reviewCards.toArray(),
      db.reviewEvents.toArray(),
      db.studyRooms.toArray(),
      db.roomMembers.toArray(),
      db.roomSessions.toArray(),
    ]);
  return {
    profile,
    companion,
    world,
    wallet,
    sessions,
    dailyLogs,
    inventory,
    subjects,
    quests,
    ambiencePresets,
    focusGateProfiles,
    reviewDecks,
    reviewCards,
    reviewEvents,
    studyRooms,
    roomMembers,
    roomSessions,
  };
}
