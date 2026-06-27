import type { SupabaseClient } from "@supabase/supabase-js";
import type { Changeset } from "@/lib/types";
import type { SyncBackend } from "@/lib/sync/backend";
import { changesetToRows } from "@/lib/sync/rows";

/**
 * Direct-to-Supabase sync under RLS (spec §8 allows pushing straight to the JS client).
 * This is the cheapest path on the cost model: it never invokes a Vercel function, so
 * heartbeats stay local and the server sees exactly one debounced changeset per session.
 * Upserts are owner-scoped (user_id = auth.uid()); RLS rejects anything else.
 */
export function createSupabaseSyncBackend(client: SupabaseClient): SyncBackend {
  return {
    id: "supabase",
    async push(changeset: Changeset): Promise<boolean> {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) return false; // not signed in yet → keep everything local

      const rows = changesetToRows(changeset, user.id);

      // (table, rows, conflict target) — upsert each owner-scoped under RLS.
      const ops: Array<[string, Record<string, unknown>[], string]> = [
        ["profiles", rows.profiles, "user_id"],
        ["companion_state", rows.companion_state, "user_id"],
        ["world_state", rows.world_state, "user_id"],
        ["wallet", rows.wallet, "user_id"],
        ["sessions", rows.sessions, "id"],
        ["daily_logs", rows.daily_logs, "user_id,date"],
        ["inventory", rows.inventory, "id"],
        ["subjects", rows.subjects, "id"],
        ["quests", rows.quests, "id"],
        ["ambience_presets", rows.ambience_presets, "id"],
        ["focus_gate_profiles", rows.focus_gate_profiles, "id"],
        ["review_decks", rows.review_decks, "id"],
        ["review_cards", rows.review_cards, "id"],
        ["review_events", rows.review_events, "id"],
        ["study_rooms", rows.study_rooms, "id"],
        ["room_members", rows.room_members, "id"],
        ["room_sessions", rows.room_sessions, "id"],
      ];

      let ok = true;
      for (const [table, data, onConflict] of ops) {
        if (data.length === 0) continue;
        const { error } = await client.from(table).upsert(data, { onConflict });
        if (error) ok = false;
      }
      return ok;
    },
  };
}
