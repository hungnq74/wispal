import type {
  Changeset,
  UserProfile,
  CompanionState,
  WorldState,
  Wallet,
  FocusSession,
  DailyLog,
  InventoryItem,
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
 * Pure mappers between the local (camelCase) domain model and Postgres (snake_case)
 * rows. Shared by the browser sync backend and the /api/sync route so there is ONE
 * definition of how a record becomes a row (and back). Every row is stamped with
 * user_id = the authenticated owner, which RLS then enforces.
 */

export function profileRow(p: UserProfile, userId: string) {
  return {
    user_id: userId,
    display_name: p.displayName,
    is_guest: p.isGuest,
    created_at: p.createdAt,
    timezone: p.timezone,
    settings: p.settings,
  };
}

export function companionRow(c: CompanionState, userId: string) {
  return {
    user_id: userId,
    pack_id: c.packId,
    mood: c.mood,
    bond_points: c.bondPoints,
    bond_tier: c.bondTier,
    voice_pack_id: c.voicePackId,
    equipped_cosmetics: c.equippedCosmetics,
    pet_needs: c.petNeeds,
    pet_memory: c.petMemory,
    active_pet_action_id: c.activePetActionId,
    active_pet_action_at: c.activePetActionAt,
    active_pet_runtime: c.activePetRuntime,
    active_pet_route: c.activePetRoute,
    room_x: c.roomX,
    last_interaction_at: c.lastInteractionAt,
  };
}

export function worldRow(w: WorldState, userId: string) {
  return {
    user_id: userId,
    theme_id: w.themeId,
    growth_points: w.growthPoints,
    unlocked_elements: w.unlockedElements,
    decor_placements: w.decorPlacements ?? [],
  };
}

export function walletRow(w: Wallet, userId: string) {
  return { user_id: userId, soft_currency: w.softCurrency };
}

export function sessionRow(s: FocusSession, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    intention: s.intention,
    mode: s.mode ?? "focus",
    quest_id: s.questId ?? null,
    subject_id: s.subjectId ?? null,
    room_id: s.roomId ?? null,
    planned_minutes: s.plannedMinutes,
    actual_active_minutes: s.actualActiveMinutes,
    started_at: s.startedAt,
    ended_at: s.endedAt,
    completed: s.completed,
    flow_detected: s.flowDetected,
  };
}

export function dailyLogRow(d: DailyLog, userId: string) {
  return {
    user_id: userId,
    date: d.date,
    total_active_minutes: d.totalActiveMinutes,
    sessions_completed: d.sessionsCompleted,
    goal_hit: d.goalHit,
    reflection: d.reflection,
    reward_claims: d.rewardClaims ?? [],
    daily_earned_sparks: d.dailyEarnedSparks ?? 0,
  };
}

export function inventoryRow(i: InventoryItem, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    type: i.type,
    source: i.source,
    acquired_at: i.acquiredAt,
  };
}

export function subjectRow(s: SubjectTag, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    name: s.name,
    color: s.color,
    weekly_target_minutes: s.weeklyTargetMinutes ?? null,
    archived_at: s.archivedAt ?? null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

export function questRow(q: Quest, userId: string) {
  return {
    id: q.id,
    user_id: userId,
    title: q.title,
    subject_id: q.subjectId ?? null,
    status: q.status,
    sort_order: q.sortOrder,
    notes: q.notes ?? "",
    created_at: q.createdAt,
    updated_at: q.updatedAt,
    completed_at: q.completedAt ?? null,
    archived_at: q.archivedAt ?? null,
  };
}

export function ambiencePresetRow(p: AmbiencePreset, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    theme_id: p.themeId,
    muted: p.muted,
    master_volume: p.masterVolume,
    layers: p.layers,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}

export function focusGateProfileRow(p: FocusGateProfile, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    mode: p.mode,
    enabled: p.enabled,
    active_only_during_sessions: p.activeOnlyDuringSessions,
    blocklist: p.blocklist,
    allowlist: p.allowlist,
    bypass_minutes: p.bypassMinutes,
    bypass_until: p.bypassUntil ?? null,
    updated_at: p.updatedAt,
  };
}

export function reviewDeckRow(d: ReviewDeck, userId: string) {
  return {
    id: d.id,
    user_id: userId,
    name: d.name,
    subject_id: d.subjectId ?? null,
    archived_at: d.archivedAt ?? null,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}

export function reviewCardRow(c: ReviewCard, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    deck_id: c.deckId,
    front: c.front,
    back: c.back,
    box: c.box,
    due_at: c.dueAt,
    bloom: c.bloom,
    archived_at: c.archivedAt ?? null,
    created_at: c.createdAt,
    updated_at: c.updatedAt,
  };
}

export function reviewEventRow(e: ReviewEvent, userId: string) {
  return {
    id: e.id,
    user_id: userId,
    card_id: e.cardId,
    deck_id: e.deckId,
    remembered: e.remembered,
    reviewed_at: e.reviewedAt,
  };
}

export function studyRoomRow(r: StudyRoom, userId: string) {
  return {
    id: r.id,
    user_id: userId,
    host_user_id: r.hostUserId,
    name: r.name,
    invite_code: r.inviteCode,
    visibility: r.visibility,
    subject_id: r.subjectId ?? null,
    planned_minutes: r.plannedMinutes,
    break_minutes: r.breakMinutes,
    cohort_label: r.cohortLabel ?? null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    archived_at: r.archivedAt ?? null,
  };
}

export function roomMemberRow(m: RoomMember, userId: string) {
  return {
    id: m.id,
    user_id: userId,
    room_id: m.roomId,
    member_user_id: m.userId,
    display_alias: m.displayAlias,
    role: m.role,
    joined_at: m.joinedAt,
  };
}

export function roomSessionRow(s: RoomSession, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    room_id: s.roomId,
    host_user_id: s.hostUserId,
    phase: s.phase,
    started_at: s.startedAt,
    planned_minutes: s.plannedMinutes,
    ended_at: s.endedAt ?? null,
  };
}

/** Decompose a changeset into per-table row arrays ready to upsert. */
export function changesetToRows(cs: Changeset, userId: string) {
  return {
    profiles: cs.profile ? [profileRow(cs.profile, userId)] : [],
    companion_state: cs.companion ? [companionRow(cs.companion, userId)] : [],
    world_state: cs.world ? [worldRow(cs.world, userId)] : [],
    wallet: cs.wallet ? [walletRow(cs.wallet, userId)] : [],
    sessions: cs.sessions.map((s) => sessionRow(s, userId)),
    daily_logs: cs.dailyLogs.map((d) => dailyLogRow(d, userId)),
    inventory: cs.inventory.map((i) => inventoryRow(i, userId)),
    subjects: cs.subjects.map((s) => subjectRow(s, userId)),
    quests: cs.quests.map((q) => questRow(q, userId)),
    ambience_presets: cs.ambiencePresets.map((p) => ambiencePresetRow(p, userId)),
    focus_gate_profiles: cs.focusGateProfiles.map((p) => focusGateProfileRow(p, userId)),
    review_decks: cs.reviewDecks.map((d) => reviewDeckRow(d, userId)),
    review_cards: cs.reviewCards.map((c) => reviewCardRow(c, userId)),
    review_events: cs.reviewEvents.map((e) => reviewEventRow(e, userId)),
    study_rooms: cs.studyRooms.map((r) => studyRoomRow(r, userId)),
    room_members: cs.roomMembers.map((m) => roomMemberRow(m, userId)),
    room_sessions: cs.roomSessions.map((s) => roomSessionRow(s, userId)),
  };
}
