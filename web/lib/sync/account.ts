"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { flushSync } from "@/lib/sync";
import { useWispalStore } from "@/lib/store/useWispalStore";

/**
 * Account lifecycle (spec §8). Guest mode is fully functional offline; "create account"
 * upgrades the guest profile and migrates ALL local Dexie data into Postgres.
 *
 * The migration is the classic place to silently lose bond + journal data, so it is
 * deliberately simple and idempotent: stamp the local profile with the authenticated
 * user id, then push the ENTIRE local snapshot in one changeset (upserts are last-write-
 * wins per record). Re-running it is harmless.
 */

function appUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
  );
}

/** Send a passwordless magic-link sign-in email. */
export async function signInWithEmail(email: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${appUrl()}/api/auth/callback` },
  });
  return !error;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await getSupabaseBrowser().auth.signOut();
}

/**
 * Run once after authentication. If a Supabase user exists and the local profile is
 * still a guest, adopt the auth user id and push everything up. Returns true if a
 * migration happened. SAFE to call on every load.
 */
export async function migrateGuestToAccount(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseBrowser();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const store = useWispalStore.getState();
  if (!store.profile.isGuest && store.profile.id === user.id) {
    // Already migrated — nothing to do.
    return false;
  }

  // Adopt the authenticated identity locally so all future syncs align by user id.
  store.setProfile({ ...store.profile, id: user.id, isGuest: false });

  // Push the full local snapshot. flushSync resolves the Supabase backend, which now
  // sees an authenticated user and upserts every owner-scoped record.
  const ok = await flushSync();
  return ok;
}
