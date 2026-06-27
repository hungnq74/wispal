import type { Changeset } from "@/lib/types";

/**
 * Sync backend SEAM. The whole product runs local-first; cloud is optional and
 * env-gated. `NoopSyncBackend` is used when no Supabase project is configured — the
 * app is fully functional as a guest with it. `SupabaseSyncBackend` (see ./supabase)
 * activates automatically once env vars are present.
 */
export interface SyncBackend {
  readonly id: string;
  /** Push one debounced changeset. Resolves true on success, false to keep it queued. */
  push: (changeset: Changeset) => Promise<boolean>;
}

export const NoopSyncBackend: SyncBackend = {
  id: "noop",
  async push() {
    // Local-only mode: nothing to do. The changeset stays in IndexedDB as the
    // single source of truth until/unless cloud is configured.
    return true;
  },
};
