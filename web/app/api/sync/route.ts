import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { changesetToRows } from "@/lib/sync/rows";
import type { Changeset } from "@/lib/types";

/**
 * Debounced changeset endpoint (spec §7). This is the SERVER-mediated sync path; the
 * default client path writes directly to Supabase under RLS (cheaper — no Vercel
 * invocation). Both share one row-mapping (lib/sync/rows). The client only ever sends
 * ONE changeset per session here — never a per-heartbeat stream (spec §2.2 / §10).
 */
export async function POST(request: Request) {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ ok: false, reason: "cloud-not-configured" }, { status: 501 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, reason: "unauthenticated" }, { status: 401 });
  }

  let changeset: Changeset;
  try {
    changeset = (await request.json()) as Changeset;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const rows = changesetToRows(changeset, user.id);
  const ops: Array<[string, Record<string, unknown>[], string]> = [
    ["profiles", rows.profiles, "user_id"],
    ["companion_state", rows.companion_state, "user_id"],
    ["world_state", rows.world_state, "user_id"],
    ["wallet", rows.wallet, "user_id"],
    ["sessions", rows.sessions, "id"],
    ["daily_logs", rows.daily_logs, "user_id,date"],
    ["inventory", rows.inventory, "id"],
  ];

  let ok = true;
  for (const [table, data, onConflict] of ops) {
    if (data.length === 0) continue;
    const { error } = await supabase.from(table).upsert(data, { onConflict });
    if (error) ok = false;
  }

  return NextResponse.json({ ok }, { status: ok ? 200 : 500 });
}
