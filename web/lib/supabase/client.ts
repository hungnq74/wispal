"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Env-gated Supabase browser client. With no env vars set, the whole cloud layer stays
 * dark and the app runs fully local-first as a guest. Set NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (and apply supabase/migrations/0001_init.sql) to light
 * it up. The anon key is safe in the browser — Row Level Security enforces access.
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

let _client: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured (running local-first only).");
  }
  if (!_client) _client = createBrowserClient(URL as string, ANON as string);
  return _client;
}
