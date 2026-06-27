"use client";

import { useEffect } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { isSupabaseConfigured, getSupabaseBrowser } from "@/lib/supabase/client";
import { migrateGuestToAccount } from "@/lib/sync/account";

/**
 * After local hydration, if cloud is configured, migrate guest data into the account
 * once a session exists — and again whenever the user signs in during this session.
 * No-op entirely when Supabase isn't configured (pure local-first).
 */
export function SyncBoot() {
  const hydrated = useWispalStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured()) return;
    void migrateGuestToAccount();
    const supabase = getSupabaseBrowser();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") void migrateGuestToAccount();
    });
    return () => data.subscription.unsubscribe();
  }, [hydrated]);

  return null;
}
