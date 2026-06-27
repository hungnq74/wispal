# Wispal

> The study companion that lives in your new tab, studies alongside you, and refuses to burn you out.

Wispal is a **new-tab study companion**. Open a tab and your buddy is already there: set a
10-second intention, start a focus block, and a companion studies beside you. Finishing a
block paints growth into a **garden you build from your own focus**; at night it asks "how'd
it go?" — a journal disguised as care. The defining mechanic is **anti-burnout**: the buddy
*tires when you overwork and insists you rest*. Resting is a win condition. You literally
cannot grind it to death.

This repo is the **V1 / MVP**: the full emotional loop, working offline as a guest, plus the
new-tab extension doorway, a PWA, and an env-gated cloud layer.

## What's here

```
wispal/
├─ web/         Next.js 15 app (the full experience) → deploy to Vercel
├─ extension/   MV3 new-tab extension (separate build) → load unpacked / Chrome Web Store
└─ scripts/     guardrails.mjs — enforces the product invariants
```

Hosting boundary (important): **Vercel hosts the webapp + thin API routes only.**
**Supabase** hosts auth, Postgres (RLS), and storage. The **extension** and the
**local-first store** (Dexie/IndexedDB, in the browser) live outside both.

## Quick start

```bash
pnpm install
pnpm dev            # web app at http://localhost:3000  (runs fully local-first as a guest)
```

That's it — no accounts, no keys. Everything persists locally in IndexedDB.

In development a small **🛠 dev** panel (bottom-right) lets you drive the loop without
waiting on real timers: complete a block, hit a goal, trip the fatigue guard, etc.

### Other commands

```bash
pnpm test          # unit tests (companion FSM + guest→account migration no-data-loss)
pnpm build         # production build of web + extension
pnpm guardrails    # assert: no leaderboard/ranking, no volume multiplier, no runtime LLM
```

## The loop (and where it lives)

| Step | Lives in |
|---|---|
| Companion state machine (the heart) | `web/features/companion/fsm.ts` (pure, unit-tested) |
| Session engine (timer, flow, fatigue, daily goal) | `web/features/session/useSessionEngine.ts` |
| Presence (extension idle ↔ Page Visibility fallback) | `web/lib/signals/presence.ts` |
| Local-first store (write-through to IndexedDB) | `web/lib/store/`, `web/lib/db/schema.ts` |
| Garden world (grows from `growthPoints`) | `web/features/world/`, `web/lib/world.ts` |
| Dialogue (data, not code; bond-gated) | `web/content/`, `web/features/content/loader.ts` |
| Economy + entitlement seam | `web/lib/economy.ts`, `web/features/entitlement/canAccess.ts` |
| Cloud sync (env-gated) + guest→account migration | `web/lib/sync/`, `web/lib/supabase/` |

## Product invariants (enforced by `pnpm guardrails`)

- **No ranking, no leaderboards** — ever. Gamify *moments, not minutes*.
- **No volume-based reward multiplier** — only a capped, opt-in *consistency* (streak) bonus.
- **No runtime LLM** — every word the companion says comes from content packs (`web/content/`).
- **Anti-burnout guard is on by default and not skippable.** Resting pays in bond + currency.
- **Heartbeats stay local.** The server sees one debounced changeset per session, never a
  per-second stream. Heavy assets are referenced by URL (Supabase Storage seam), never
  through Next image optimization.

## Enabling the cloud (optional)

The app is fully functional without this. To turn on accounts + cross-device sync:

1. Create a Supabase project and run `web/supabase/migrations/0001_init.sql` (creates the
   tables with **owner-scoped Row Level Security** on every one).
2. Copy `web/.env.example` → `web/.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL` +
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `NEXT_PUBLIC_APP_URL`).
3. Restart. Settings → "Save your progress" sends a magic link; on sign-in the local guest
   data migrates into the account with **no loss** (covered by `lib/sync/migration.test.ts`).

## The new-tab extension (the doorway)

```bash
WISPAL_APP_URL=http://localhost:3000 pnpm --filter @wispal/extension build
```

Then in Chrome → `chrome://extensions` → enable Developer mode → **Load unpacked** →
select `extension/dist`. Open a new tab: your buddy is there. The extension only ever sends
a coarse presence status (active/idle) into the embedded webapp — never page content, URLs,
history, or keystrokes.

## Not in V1 (seams left in place)

Real billing (entitlement is stubbed via `hasPlus`), the creator marketplace (packs are
already data, not code), social presence (Supabase Realtime, flagged off), live TTS
(dialogue is text-first, `audioRef` optional), and a public server-rendered "Year in Study"
share page (rendered client-side from local data in V1).
