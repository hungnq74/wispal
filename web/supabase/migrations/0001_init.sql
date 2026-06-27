-- Wispal V1 schema (spec §2 / §10).
-- Every table is OWNER-SCOPED via Row Level Security: a row is readable/writable only
-- by the authenticated user whose id it carries. Presence (V1.1) is the only planned
-- cross-user read and is NOT a table here. Apply this to your Supabase project, then
-- set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to light up cloud sync.

-- ── profiles ────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'friend',
  is_guest     boolean not null default false,
  created_at   timestamptz not null default now(),
  timezone     text not null default 'UTC',
  settings     jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ── companion_state (one per user) ───────────────────────────────────────────────
create table if not exists public.companion_state (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  pack_id            text not null,
  mood               text not null,
  bond_points        integer not null default 0,
  bond_tier          text not null default 'new',
  voice_pack_id      text,
  equipped_cosmetics jsonb not null default '[]'::jsonb,
  pet_needs          jsonb not null default '{"energy":78,"playfulness":62,"lastFedAt":null,"lastPettedAt":null,"lastActionAt":null}'::jsonb,
  pet_memory         jsonb not null default '[]'::jsonb,
  active_pet_action_id text,
  active_pet_action_at bigint,
  active_pet_runtime jsonb,
  active_pet_route jsonb,
  room_x             numeric not null default 0.5,
  last_interaction_at bigint not null default 0
);

alter table public.companion_state add column if not exists pet_needs jsonb not null default '{"energy":78,"playfulness":62,"lastFedAt":null,"lastPettedAt":null,"lastActionAt":null}'::jsonb;
alter table public.companion_state add column if not exists pet_memory jsonb not null default '[]'::jsonb;
alter table public.companion_state add column if not exists active_pet_action_id text;
alter table public.companion_state add column if not exists active_pet_action_at bigint;
alter table public.companion_state add column if not exists active_pet_runtime jsonb;
alter table public.companion_state add column if not exists active_pet_route jsonb;
alter table public.companion_state add column if not exists room_x numeric not null default 0.5;

-- ── world_state (one per user) ───────────────────────────────────────────────────
create table if not exists public.world_state (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  theme_id          text not null,
  growth_points     integer not null default 0,
  unlocked_elements jsonb not null default '[]'::jsonb
);

-- ── wallet (one per user) ────────────────────────────────────────────────────────
create table if not exists public.wallet (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  soft_currency integer not null default 0
);

-- ── sessions ─────────────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id                    uuid primary key,
  user_id               uuid not null references auth.users (id) on delete cascade,
  intention             text not null default '',
  mode                  text not null default 'focus',
  quest_id              text,
  subject_id            text,
  room_id               text,
  planned_minutes       numeric not null default 25,
  actual_active_minutes numeric not null default 0,
  started_at            timestamptz not null,
  ended_at              timestamptz,
  completed             boolean not null default false,
  flow_detected         boolean not null default false
);
create index if not exists sessions_user_idx on public.sessions (user_id, started_at desc);

alter table public.sessions add column if not exists mode text not null default 'focus';
alter table public.sessions add column if not exists quest_id text;
alter table public.sessions add column if not exists subject_id text;
alter table public.sessions add column if not exists room_id text;

-- ── daily_logs (one per user per local date) ─────────────────────────────────────
create table if not exists public.daily_logs (
  user_id              uuid not null references auth.users (id) on delete cascade,
  date                 text not null,
  total_active_minutes numeric not null default 0,
  sessions_completed   integer not null default 0,
  goal_hit             boolean not null default false,
  reflection           jsonb,
  reward_claims        jsonb not null default '[]'::jsonb,
  daily_earned_sparks  integer not null default 0,
  primary key (user_id, date)
);

alter table public.daily_logs add column if not exists reward_claims jsonb not null default '[]'::jsonb;
alter table public.daily_logs add column if not exists daily_earned_sparks integer not null default 0;

-- ── inventory ────────────────────────────────────────────────────────────────────
create table if not exists public.inventory (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null,
  source      text not null,
  acquired_at timestamptz not null default now()
);
create index if not exists inventory_user_idx on public.inventory (user_id);

alter table public.world_state add column if not exists decor_placements jsonb not null default '[]'::jsonb;

-- ── Phase 1: quest board / subjects / ambience ────────────────────────────────
create table if not exists public.subjects (
  id                    text primary key,
  user_id               uuid not null references auth.users (id) on delete cascade,
  name                  text not null,
  color                 text not null,
  weekly_target_minutes numeric,
  archived_at           timestamptz,
  created_at            timestamptz not null,
  updated_at            timestamptz not null
);
create index if not exists subjects_user_idx on public.subjects (user_id, archived_at);

create table if not exists public.quests (
  id           text primary key,
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  subject_id   text,
  status       text not null default 'open',
  sort_order   numeric not null default 0,
  notes        text not null default '',
  created_at   timestamptz not null,
  updated_at   timestamptz not null,
  completed_at timestamptz,
  archived_at  timestamptz
);
create index if not exists quests_user_idx on public.quests (user_id, status, sort_order);

create table if not exists public.ambience_presets (
  id            text primary key,
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  theme_id      text not null,
  muted         boolean not null default true,
  master_volume numeric not null default 0.45,
  layers        jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null,
  updated_at    timestamptz not null
);
create index if not exists ambience_presets_user_idx on public.ambience_presets (user_id, updated_at desc);

-- ── Phase 2: focus gate / recall / decor ──────────────────────────────────────
create table if not exists public.focus_gate_profiles (
  id                          text primary key,
  user_id                     uuid not null references auth.users (id) on delete cascade,
  mode                        text not null default 'soft',
  enabled                     boolean not null default false,
  active_only_during_sessions boolean not null default true,
  blocklist                   jsonb not null default '[]'::jsonb,
  allowlist                   jsonb not null default '[]'::jsonb,
  bypass_minutes              integer not null default 5,
  bypass_until                bigint,
  updated_at                  timestamptz not null
);

create table if not exists public.review_decks (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  subject_id  text,
  archived_at timestamptz,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);
create index if not exists review_decks_user_idx on public.review_decks (user_id, archived_at);

create table if not exists public.review_cards (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  deck_id     text not null,
  front       text not null,
  back        text not null,
  box         integer not null default 1,
  due_at      timestamptz not null,
  bloom       numeric not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null,
  updated_at  timestamptz not null
);
create index if not exists review_cards_user_idx on public.review_cards (user_id, deck_id, due_at);

create table if not exists public.review_events (
  id          text primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  card_id     text not null,
  deck_id     text not null,
  remembered  boolean not null,
  reviewed_at timestamptz not null
);
create index if not exists review_events_user_idx on public.review_events (user_id, reviewed_at desc);

-- ── Phase 3: quiet rooms (metadata only; live state uses Realtime) ─────────────
create table if not exists public.study_rooms (
  id              text primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  host_user_id    text not null,
  name            text not null,
  invite_code     text not null unique,
  visibility      text not null default 'invite',
  subject_id      text,
  planned_minutes numeric not null default 25,
  break_minutes   numeric not null default 5,
  cohort_label    text,
  created_at      timestamptz not null,
  updated_at      timestamptz not null,
  archived_at     timestamptz
);
create index if not exists study_rooms_invite_idx on public.study_rooms (invite_code);

create table if not exists public.room_members (
  id             text primary key,
  user_id        uuid not null references auth.users (id) on delete cascade,
  room_id        text not null,
  member_user_id text not null,
  display_alias  text not null,
  role           text not null default 'member',
  joined_at      timestamptz not null
);
create index if not exists room_members_room_idx on public.room_members (room_id, member_user_id);

create table if not exists public.room_sessions (
  id              text primary key,
  user_id         uuid not null references auth.users (id) on delete cascade,
  room_id         text not null,
  host_user_id    text not null,
  phase           text not null default 'idle',
  started_at      timestamptz not null,
  planned_minutes numeric not null default 25,
  ended_at        timestamptz
);
create index if not exists room_sessions_room_idx on public.room_sessions (room_id, started_at desc);

-- ── Row Level Security: owner-scoped on every table ──────────────────────────────
alter table public.profiles        enable row level security;
alter table public.companion_state enable row level security;
alter table public.world_state     enable row level security;
alter table public.wallet          enable row level security;
alter table public.sessions        enable row level security;
alter table public.daily_logs      enable row level security;
alter table public.inventory       enable row level security;
alter table public.subjects        enable row level security;
alter table public.quests          enable row level security;
alter table public.ambience_presets enable row level security;
alter table public.focus_gate_profiles enable row level security;
alter table public.review_decks    enable row level security;
alter table public.review_cards    enable row level security;
alter table public.review_events   enable row level security;
alter table public.study_rooms     enable row level security;
alter table public.room_members    enable row level security;
alter table public.room_sessions   enable row level security;

-- One policy per table: the row's user_id must equal the caller's auth.uid().
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','companion_state','world_state','wallet','sessions','daily_logs','inventory',
    'subjects','quests','ambience_presets','focus_gate_profiles','review_decks',
    'review_cards','review_events','room_sessions'
  ]
  loop
    execute format($f$
      drop policy if exists owner_all on public.%I;
      create policy owner_all on public.%I
        for all
        using (user_id = auth.uid())
        with check (user_id = auth.uid());
    $f$, t, t);
  end loop;
end $$;

drop policy if exists room_member_read on public.study_rooms;
create policy room_member_read on public.study_rooms
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.room_members m
      where m.room_id = study_rooms.id
        and m.member_user_id = auth.uid()::text
    )
  );

drop policy if exists room_owner_write on public.study_rooms;
create policy room_owner_write on public.study_rooms
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists room_members_visible_to_room on public.room_members;
create policy room_members_visible_to_room on public.room_members
  for select
  using (
    user_id = auth.uid()
    or member_user_id = auth.uid()::text
    or exists (
      select 1 from public.study_rooms r
      where r.id = room_members.room_id
        and r.user_id = auth.uid()
    )
  );

drop policy if exists room_members_owner_write on public.room_members;
create policy room_members_owner_write on public.room_members
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
