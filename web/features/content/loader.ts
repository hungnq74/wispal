/**
 * Content-pack loader. Packs are DATA, not code (spec §1.2 / §3) — companions, voices,
 * and themes are JSON, so the future creator marketplace just drops more JSON in (or
 * serves it from Supabase Storage) without shipping new code. This module is the single
 * place that knows how to find a pack and pick a line.
 *
 * HARD CONSTRAINT: no LLM at runtime. Every word the companion says is selected from
 * these packs and filled with simple {var} templating — nothing is generated.
 */
import type {
  CompanionPack,
  VoicePack,
  ThemePack,
  ShopItem,
  DialogueTrigger,
  BondTier,
  DialogueLine,
} from "@/lib/types";
import { tierAtLeast } from "@/lib/bond";
import { buildCompanionPacks, buildCompanionShopItems } from "@/features/design/companions";

import wisp from "@/content/companions/wisp.json";
import lumen from "@/content/companions/lumen.json";
import mote from "@/content/companions/mote.json";
import ember from "@/content/companions/ember.json";
import gentle from "@/content/voices/gentle.json";
import sassy from "@/content/voices/sassy.json";
import themeIndex from "@/content/themes/index.json";
import catalog from "@/content/catalog.json";
import { resolveThemeId, validateThemePack } from "@/lib/scene";

// ── Registries (a marketplace would populate these from Storage) ────────────────
const COMPANIONS: Record<string, CompanionPack> = {
  [wisp.id]: wisp as CompanionPack,
  [lumen.id]: lumen as CompanionPack,
  [mote.id]: mote as CompanionPack,
  [ember.id]: ember as CompanionPack,
};
// The 30-pet library generates a builtin CompanionPack per pet; hand-authored JSON packs
// (the four above) win on id collision so their tuned moodMap/voice stay authoritative.
for (const pack of buildCompanionPacks()) {
  if (!COMPANIONS[pack.id]) COMPANIONS[pack.id] = pack;
}

const VOICES: Record<string, VoicePack> = {
  [gentle.id]: gentle as VoicePack,
  [sassy.id]: sassy as VoicePack,
};

const THEME_LIST = themeIndex as ThemePack[];
const THEMES: Record<string, ThemePack> = Object.fromEntries(THEME_LIST.map((theme) => [theme.id, theme]));

// Base catalogue + generated companion shop items (existing entries win on id collision,
// so lumen/mote/ember keep their authored copy and prices).
const CATALOG: ShopItem[] = (() => {
  const base = catalog as ShopItem[];
  const seen = new Set(base.map((i) => i.id));
  return [...base, ...buildCompanionShopItems().filter((i) => !seen.has(i.id))];
})();

// ── Lookups ─────────────────────────────────────────────────────────────────────
export function getCompanionPack(id: string): CompanionPack | undefined {
  return COMPANIONS[id];
}
export function getVoicePack(id: string | null): VoicePack | undefined {
  return id ? VOICES[id] : undefined;
}
export function getThemePack(id: string): ThemePack | undefined {
  return THEMES[resolveThemeId(id, Object.keys(THEMES))];
}
export function listThemes(): ThemePack[] {
  return THEME_LIST;
}
export function getShopCatalog(): ShopItem[] {
  return CATALOG;
}
export function getShopItem(id: string): ShopItem | undefined {
  return CATALOG.find((i) => i.id === id);
}

// ── Dialogue ─────────────────────────────────────────────────────────────────────
export type LineVars = Record<string, string | number | undefined>;

/** Replace {key} tokens; unknown/empty tokens collapse cleanly so copy never breaks. */
export function fillTemplate(text: string, vars: LineVars = {}): string {
  return text
    .replace(/\{(\w+)\}/g, (_, key: string) => {
      const v = vars[key];
      return v === undefined || v === null ? "" : String(v);
    })
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** All lines for a trigger that the current bond tier has unlocked. */
export function eligibleLines(
  voicePackId: string | null,
  trigger: DialogueTrigger,
  bondTier: BondTier,
): DialogueLine[] {
  const pack = getVoicePack(voicePackId);
  if (!pack) return [];
  return pack.lines.filter(
    (l) => l.trigger === trigger && (!l.minBondTier || tierAtLeast(bondTier, l.minBondTier)),
  );
}

export interface PickedLine {
  text: string;
  audioRef?: string;
}

/**
 * Pick a tier-appropriate line for a trigger and fill its template.
 * `seed` makes selection deterministic when supplied (tests / SSR); otherwise random.
 */
export function pickLine(
  voicePackId: string | null,
  trigger: DialogueTrigger,
  bondTier: BondTier,
  vars: LineVars = {},
  seed?: number,
): PickedLine | null {
  const lines = eligibleLines(voicePackId, trigger, bondTier);
  if (lines.length === 0) return null;
  const idx =
    seed !== undefined
      ? Math.abs(Math.floor(seed)) % lines.length
      : Math.floor(Math.random() * lines.length);
  const line = lines[idx];
  return { text: fillTemplate(line.text, vars), audioRef: line.audioRef };
}

/** Light shape validation — surfaces a malformed community pack early (dev aid). */
export function validatePacks(): string[] {
  const problems: string[] = [];
  for (const [id, c] of Object.entries(COMPANIONS)) {
    if (!c.moodMap || !c.name) problems.push(`companion ${id} missing fields`);
  }
  for (const [id, v] of Object.entries(VOICES)) {
    if (!Array.isArray(v.lines)) problems.push(`voice ${id} has no lines[]`);
  }
  for (const theme of THEME_LIST) {
    problems.push(...validateThemePack(theme));
  }
  return problems;
}
