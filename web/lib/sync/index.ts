"use client";

import type { Changeset } from "@/lib/types";
import { snapshotLocal } from "@/lib/db/schema";
import { NoopSyncBackend, type SyncBackend } from "@/lib/sync/backend";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseSyncBackend } from "@/lib/sync/supabase";

let _backend: SyncBackend | null = null;

/**
 * Resolve the active backend ONCE. Supabase is chosen automatically when configured
 * AND a user session exists; otherwise we stay local-only (Noop). This is the single
 * place cloud sync is switched on — wiring real billing/cloud later touches only here.
 */
export function getSyncBackend(): SyncBackend {
  if (_backend) return _backend;
  if (isSupabaseConfigured()) {
    _backend = createSupabaseSyncBackend(getSupabaseBrowser());
  } else {
    _backend = NoopSyncBackend;
  }
  return _backend;
}

/** Build one changeset from the full local store (last-write-wins per record). */
export async function buildChangeset(): Promise<Changeset> {
  const snap = await snapshotLocal();
  return {
    profile: snap.profile ?? null,
    companion: snap.companion ?? null,
    world: snap.world ?? null,
    wallet: snap.wallet ?? null,
    sessions: snap.sessions,
    dailyLogs: snap.dailyLogs,
    inventory: snap.inventory,
    subjects: snap.subjects,
    quests: snap.quests,
    ambiencePresets: snap.ambiencePresets,
    focusGateProfiles: snap.focusGateProfiles,
    reviewDecks: snap.reviewDecks,
    reviewCards: snap.reviewCards,
    reviewEvents: snap.reviewEvents,
    studyRooms: snap.studyRooms,
    roomMembers: snap.roomMembers,
    roomSessions: snap.roomSessions,
    clientUpdatedAt: Date.now(),
  };
}

let timer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 4000;

/**
 * Schedule a debounced sync. Call this at meaningful checkpoints (session end, day
 * close) — NOT on heartbeats. Coalesces bursts into a single push so the server sees
 * one changeset per session, not a per-second stream (spec §2.2 cost guardrail).
 */
export function scheduleSync(): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    void flushSync();
  }, DEBOUNCE_MS);
}

export async function flushSync(): Promise<boolean> {
  try {
    const changeset = await buildChangeset();
    return await getSyncBackend().push(changeset);
  } catch {
    return false; // offline-tolerant: local store remains the source of truth
  }
}
