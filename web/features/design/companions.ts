/**
 * Wispal companion library — the 30-pet content set, ported from the design canvases
 * "Wispal Companions.dc.html" (the library) and "Wispal Companion Animator.dc.html"
 * (the limbed rig). Pure DATA + a tiny `compose()` engine — no LLM, no Rive assets.
 *
 * Composed pets are built from a shared 12×16 BASE body plus interchangeable feature
 * layers (ears / eyes / mouth / belly / accessories); they carry a limbed rig (arms +
 * legs) so they can walk, hop and dance. Bespoke pets (the wisp, ghost, orb, lantern and
 * the aquatic/elemental silhouettes) are single hand-authored grids that float in place.
 *
 * The four shipped companions (wisp/lumen/mote/ember) reuse the EXISTING grids from
 * `pixel.tsx` so current users see no change — only their catalogue/library metadata
 * lives here. Everything else drops straight onto the existing content-pack + shop
 * plumbing via `buildCompanionPacks()` / `buildCompanionShopItems()`.
 */
import { COMPANION_SPRITES, type CompanionKey, type Palette } from "@/features/design/pixel";
import type { CompanionMood, CompanionPack, ShopItem } from "@/lib/types";

// ── Compose engine (faithful port of the .dc.html `compose()` + FEAT map) ───────────
const W = 12;
const H = 16;

const BASE = [
  "............", "............", "............", "............",
  "...oooooo...", "..obllbbbo..", ".obllbbbbbo.", ".obbbbbbbbo.",
  ".obbbbbbbbo.", ".obbbbbbbbo.", ".obbbbbbbbo.", ".obbbbbbbbo.",
  "..obbbbbbo..", "...oooooo...", "............", "............",
];

type Layer = { grid: string[]; dx?: number; dy?: number };

function compose(layers: Layer[]): string[] {
  const c = Array.from({ length: H }, () => Array<string>(W).fill("."));
  for (const L of layers) {
    const g = L.grid;
    const dx = L.dx ?? 0;
    const dy = L.dy ?? 0;
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[y].length; x++) {
        const ch = g[y][x];
        if (ch === "." || ch === " ") continue;
        const ty = y + dy;
        const tx = x + dx;
        if (ty >= 0 && ty < H && tx >= 0 && tx < W) c[ty][tx] = ch;
      }
    }
  }
  return c.map((r) => r.join(""));
}

const FEAT: Record<string, Layer> = {
  ears_cat: { dy: 2, grid: ["..o......o..", ".obo....obo.", ".obbo..obbo."] },
  ears_shiba: { dy: 3, grid: ["..o......o..", ".obo....obo."] },
  ears_fox: { dy: 0, grid: [".o........o.", ".oo......oo.", ".oko....oko.", ".obko..okbo.", ".obbo..obbo."] },
  ears_bunny: { dy: 0, grid: ["...oo..oo...", "..oko..oko..", "..obo..obo..", "..obo..obo.."] },
  ears_round: { dy: 3, grid: [".oo......oo.", "obbo....obbo", ".oo......oo."] },
  ears_horns: { dy: 1, grid: [".k........k.", ".ko......ok.", "..o......o.."] },
  ears_antenna: { dy: 0, grid: ["....k..k....", "....o..o....", "....o..o...."] },
  ears_frills: { dy: 5, grid: ["k..........k", "kk........kk", "k..........k"] },
  ears_crest: { dy: 1, grid: ["....g.g.....", "...grgr.....", "....rrr....."] },
  eye_dot: { dy: 7, grid: ["...ee..ee...", "...ee..ee..."] },
  eye_happy: { dy: 7, grid: ["...e....e...", "..eee..eee.."] },
  eye_sleepy: { dy: 8, grid: ["..eee..eee..", "............"] },
  eye_wide: { dy: 6, grid: ["..www..www..", "..wew..wew..", "..www..www.."] },
  eye_grumpy: { dy: 6, grid: ["..o.o..o.o..", "...ee..ee..."] },
  eye_derp: { dy: 6, grid: ["..www..e....", "..wew..e....", "..www......."] },
  eye_visor: { dy: 6, grid: ["..oooooooo..", "..okkkkkko..", "..oooooooo.."] },
  m_blush: { dy: 9, grid: ["..p......p.."] },
  m_tongue: { dy: 10, grid: [".....pp....."] },
  m_beak: { dy: 9, grid: [".....rr....."] },
  m_smile: { dy: 10, grid: [".....mm....."] },
  belly: { dy: 8, grid: ["....ww......", "...wwww.....", "...wwww.....", "...wwww...."] },
  acc_hat: { dy: 0, grid: ["......k.....", ".....kk.....", "....kkk.....", "...kgkkk....", "..kkkkkkk...", ".kkkkkkkkk.."] },
  acc_crown: { dy: 2, grid: ["..g.g.g.g...", "..ggggggg.."] },
  acc_star: { dy: 9, grid: ["..g......g.."] },
  acc_helmet: { dy: 3, grid: ["...cccccc...", "..cccccccc..", "...o....o..."] },
  acc_band: { dy: 6, grid: ["..kkkkkkkk..", "....k.k....."] },
  acc_sword: { dy: 4, grid: ["..........c.", "..........c.", "..........c.", "..........c.", "..........c.", "..........c.", "..........c.", "..........o.", "..........o."] },
  acc_wing: { dy: 6, grid: [".........kk.", ".........kkk", ".........kk.", "..........k."] },
  acc_tail: { dy: 11, grid: [".........kk.", "........okko", ".........kk."] },
  acc_blanket: { dy: 11, grid: ["..ssssssss..", "..ssssssss.."] },
};

export type EyeKey = "dot" | "happy" | "sleepy" | "wide" | "grumpy" | "derp" | "visor";

export interface ComposeOpts {
  b: string;
  l?: string;
  k?: string;
  e?: string;
  ears?: string;
  belly?: boolean;
  eyes?: EyeKey;
  mouth?: string;
  accs?: string[];
}

function composedSprite(o: ComposeOpts, eyesOverride?: EyeKey): { grid: string[]; palette: Palette } {
  const palette: Palette = {
    o: "#15233f", b: o.b, l: o.l ?? o.b, e: o.e ?? "#15233f", m: "#15233f",
    p: "#f3a9cb", w: "#ffffff", g: "#ffd27d", r: "#ff9e6d", s: "#8fb8f0", c: "#cdd3e0", k: o.k ?? "#ffffff",
  };
  const L: Layer[] = [{ grid: BASE }];
  if (o.ears) L.push(FEAT[o.ears]);
  if (o.belly) L.push(FEAT.belly);
  L.push(FEAT[`eye_${eyesOverride ?? o.eyes ?? "dot"}`]);
  if (o.mouth) L.push(FEAT[o.mouth]);
  (o.accs ?? []).forEach((a) => L.push(FEAT[a]));
  return { grid: compose(L), palette };
}

// ── Bespoke silhouettes (single grids, no limbs) ────────────────────────────────────
const OCTO = ["............", "...oooooo...", "..obllbbbo..", ".obbbbbbbbo.", ".obbbbbbbbo.", ".obeebbeebo.", ".obeebbeebo.", ".obbbbbbbbo.", ".obbbmmbbbo.", ".obbbbbbbbo.", ".obbbbbbbbo.", "obobobobobo.", "o.o.o.o.o.o."];
const JELLY = ["...oooooo...", "..obbbbbbo..", ".obbbbbbbbo.", ".obllbbbbbo.", ".obeebbeebo.", ".obbbbbbbbo.", ".obbbmmbbbo.", ".obbbbbbbbo.", "..oo.oo.oo..", "..b...b...b.", ".b...b...b..", "..b...b...b.", ".b...b...b.."];
const STAR = ["............", ".....gg.....", ".....gg.....", "...gggggg...", ".gggggggggg.", "..gegggeg...", "..gggggggg..", "...gggggg...", ".....gg.....", ".....gg....."];
const FLAME = [".....r......", "....rr......", "....rrr.....", "...rgggr....", "..rggggr....", "..rggggr....", ".rggeeggr...", ".rggmmggr...", ".rgggggggr..", "..rgggggr...", "...rrrrr...."];
const MUSH = ["...rrrrrr...", "..rrwrrwrr..", ".rrrrrrrrrr.", ".rwrrrrwrrr.", ".rrrrrrrrrr.", "..oooooooo..", "..obbbbbbo..", "..obebbebo..", "..obbmmbbo..", "..obbbbbbo..", "...oooooo.."];
const CACTUS = [".....ff.....", "....ffff....", "...obbbbo...", ".o.obbbbo.o.", ".obobbbbobo.", ".obobbbbobo.", "...obbbbo...", "...obebeo...", "...obbmbo...", "...obbbbo...", "..oppppppo..", "..oppppppo..", "...oooooo..."];

const P_OCTO: Palette = { o: "#15233f", b: "#caa6f0", l: "#efe2ff", e: "#15233f", m: "#15233f" };
const P_JELLY: Palette = { o: "#3a4a78", b: "#8fb8f0", l: "#cfe0f7", e: "#1b2a4a", m: "#1b2a4a" };
const P_STAR: Palette = { g: "#ffd27d", e: "#7a5a1a" };
const P_FLAME: Palette = { r: "#ff9e6d", g: "#ffd27d", e: "#15233f", m: "#15233f" };
const P_MUSH: Palette = { o: "#5a2a2a", r: "#e0584e", w: "#ffffff", b: "#f2e9d8", e: "#15233f", m: "#15233f" };
const P_CACT: Palette = { o: "#2f5a3a", b: "#6f9c6e", f: "#f3a9cb", e: "#15233f", m: "#15233f", p: "#c2914f" };

// ── The roster ──────────────────────────────────────────────────────────────────────
export type CompanionCategory = "cr" | "aq" | "sp" | "an" | "me" | "my";
export type CompanionSource = "free" | "earned" | "plus";
export type CompanionRarity = CompanionPack["rarity"]; // "common" | "rare" | "event"

interface BaseEntry {
  id: string;
  name: string;
  species: string;
  category: CompanionCategory;
  rarity: CompanionRarity;
  source: CompanionSource;
  glow: string;
  blurb: string;
}
interface ComposedEntry extends BaseEntry { kind: "composed"; o: ComposeOpts }
interface BespokeEntry extends BaseEntry { kind: "bespoke"; spriteKey?: CompanionKey; grid?: string[]; palette?: Palette }
export type CompanionEntry = ComposedEntry | BespokeEntry;

export const CATEGORY_LABELS: Record<CompanionCategory, string> = {
  cr: "Critters", aq: "Aquatic", sp: "Spirits", an: "Anime-style", me: "Meme energy", my: "Mythic",
};

export const COMPANIONS_DATA: CompanionEntry[] = [
  // ── Critters ──
  { kind: "composed", id: "mochi", name: "Mochi", species: "House cat", category: "cr", rarity: "common", source: "free", glow: "rgba(255,158,109,.4)", blurb: "Naps between blocks, judges your snacks.", o: { b: "#e8945a", l: "#f4b483", ears: "ears_cat", mouth: "m_blush" } },
  { kind: "composed", id: "biscuit", name: "Biscuit", species: "Shiba pup", category: "cr", rarity: "common", source: "free", glow: "rgba(255,210,125,.4)", blurb: "Eternally pleased you sat down to study.", o: { b: "#e8a85a", l: "#f4c98a", ears: "ears_shiba", eyes: "happy", mouth: "m_blush" } },
  { kind: "composed", id: "yuki", name: "Yuki", species: "Red fox", category: "cr", rarity: "rare", source: "earned", glow: "rgba(255,158,109,.45)", blurb: "Quiet and clever; curls up at your goal.", o: { b: "#ff9e6d", l: "#ffc7a0", k: "#ffffff", ears: "ears_fox", belly: true, accs: ["acc_tail"] } },
  { kind: "composed", id: "marsh", name: "Marsh", species: "Lop bunny", category: "cr", rarity: "common", source: "free", glow: "rgba(243,169,203,.4)", blurb: "Soft ears droop when it’s time to rest.", o: { b: "#ece9ff", l: "#ffffff", k: "#f3a9cb", ears: "ears_bunny", mouth: "m_blush" } },
  { kind: "composed", id: "peanut", name: "Peanut", species: "Hamster", category: "cr", rarity: "common", source: "earned", glow: "rgba(240,201,138,.45)", blurb: "Cheeks full of plans and sunflower seeds.", o: { b: "#f0c98a", l: "#ffe0b0", ears: "ears_round", mouth: "m_blush" } },
  // ── Aquatic ──
  { kind: "composed", id: "pico", name: "Pico", species: "Axolotl", category: "aq", rarity: "rare", source: "earned", glow: "rgba(243,169,203,.5)", blurb: "Smiles no matter how the chapter went.", o: { b: "#f3a9cb", l: "#ffd0e0", k: "#ff7ec0", ears: "ears_frills", mouth: "m_smile" } },
  { kind: "composed", id: "lily", name: "Lily", species: "Tree frog", category: "aq", rarity: "common", source: "free", glow: "rgba(143,192,140,.45)", blurb: "Big eyes, bigger calm. Blinks slowly.", o: { b: "#8fc08c", l: "#b8dca8", eyes: "wide", mouth: "m_smile" } },
  { kind: "bespoke", id: "tako", name: "Tako", species: "Octopus", category: "aq", rarity: "rare", source: "plus", glow: "rgba(202,166,240,.5)", blurb: "Eight arms, one job: keep you company.", grid: OCTO, palette: P_OCTO },
  { kind: "bespoke", id: "wobble", name: "Wobble", species: "Jellyfish", category: "aq", rarity: "rare", source: "plus", glow: "rgba(143,184,240,.5)", blurb: "Drifts in the dark, glowing gently.", grid: JELLY, palette: P_JELLY },
  { kind: "composed", id: "tux", name: "Tux", species: "Penguin", category: "aq", rarity: "common", source: "earned", glow: "rgba(143,184,240,.4)", blurb: "Formal little friend for late nights.", o: { b: "#2b2654", l: "#3a3470", eyes: "wide", belly: true, mouth: "m_beak" } },
  // ── Spirits (the four that already ship) ──
  { kind: "bespoke", id: "wisp", name: "Wispal", species: "Study wisp", category: "sp", rarity: "event", source: "free", glow: "rgba(139,224,214,.6)", blurb: "The original. Free for everyone, forever.", spriteKey: "wisp" },
  { kind: "bespoke", id: "lumen", name: "Lumen", species: "Friendly ghost", category: "sp", rarity: "common", source: "earned", glow: "rgba(184,179,238,.5)", blurb: "A cozy haunt that never spooks, only soothes.", spriteKey: "ghost" },
  { kind: "bespoke", id: "mote", name: "Mote", species: "Light mote", category: "sp", rarity: "common", source: "earned", glow: "rgba(202,166,240,.55)", blurb: "Pure ambient calm. Zero whimsy, all glow.", spriteKey: "orb" },
  { kind: "bespoke", id: "ember", name: "Ember", species: "Paper lantern", category: "sp", rarity: "event", source: "plus", glow: "rgba(255,158,109,.55)", blurb: "Carries a warm light through the night.", spriteKey: "lantern" },
  { kind: "bespoke", id: "nova", name: "Nova", species: "Shooting star", category: "sp", rarity: "rare", source: "plus", glow: "rgba(255,210,125,.6)", blurb: "Lands for a session, makes a wish with you.", grid: STAR, palette: P_STAR },
  // ── Anime-style ──
  { kind: "composed", id: "magus", name: "Magus", species: "Chibi mage", category: "an", rarity: "rare", source: "plus", glow: "rgba(184,160,232,.5)", blurb: "Casts a focus spell at every session start.", o: { b: "#b8a0e8", l: "#d8c8f5", k: "#5d4b9e", accs: ["acc_hat"] } },
  { kind: "composed", id: "stella", name: "Stella", species: "Star idol", category: "an", rarity: "rare", source: "plus", glow: "rgba(243,169,203,.5)", blurb: "Your tiny hype-friend, minus the pressure.", o: { b: "#f3a9cb", l: "#ffd0e0", eyes: "wide", accs: ["acc_crown", "acc_star"] } },
  { kind: "composed", id: "bolt", name: "Bolt", species: "Mecha-pet", category: "an", rarity: "rare", source: "plus", glow: "rgba(139,224,214,.5)", blurb: "Boots up beside you. Visor dims when you rest.", o: { b: "#a8b0c8", l: "#cdd3e0", k: "#8be0d6", ears: "ears_antenna", eyes: "visor" } },
  { kind: "composed", id: "sir-gloop", name: "Sir Gloop", species: "Slime knight", category: "an", rarity: "rare", source: "earned", glow: "rgba(143,192,140,.5)", blurb: "Squishy, loyal, guards your study hours.", o: { b: "#8fc08c", l: "#b8e0a8", accs: ["acc_helmet"] } },
  { kind: "composed", id: "kuro", name: "Kuro", species: "Samurai cat", category: "an", rarity: "event", source: "plus", glow: "rgba(224,90,74,.5)", blurb: "Disciplined, but knows when to sheathe it.", o: { b: "#4a4570", l: "#5d588a", k: "#e05a5a", ears: "ears_cat", eyes: "grumpy", accs: ["acc_band", "acc_sword"] } },
  // ── Meme energy ──
  { kind: "composed", id: "derp", name: "Derp", species: "Doggo", category: "me", rarity: "common", source: "free", glow: "rgba(232,200,154,.45)", blurb: "Maximum enthusiasm, minimum coordination.", o: { b: "#e8c89a", l: "#f5dcb0", ears: "ears_round", eyes: "derp", mouth: "m_tongue" } },
  { kind: "composed", id: "grump", name: "Grump", species: "Loaf cat", category: "me", rarity: "common", source: "earned", glow: "rgba(176,170,188,.45)", blurb: "Hates everything except you studying.", o: { b: "#b0aabc", l: "#cfc9d8", ears: "ears_cat", eyes: "grumpy", mouth: "m_smile" } },
  { kind: "bespoke", id: "toasty", name: "Toasty", species: "Calm flame", category: "me", rarity: "rare", source: "plus", glow: "rgba(255,158,109,.55)", blurb: "Everything’s fine. Truly. Deep breath.", grid: FLAME, palette: P_FLAME },
  { kind: "composed", id: "shook", name: "Shook", species: "Lil’ blob", category: "me", rarity: "common", source: "free", glow: "rgba(139,224,214,.45)", blurb: "Permanently amazed you opened the book.", o: { b: "#8be0d6", l: "#c8f5ee", eyes: "wide" } },
  { kind: "composed", id: "spud", name: "Spud", species: "Couch potato", category: "me", rarity: "common", source: "earned", glow: "rgba(216,168,106,.45)", blurb: "Living proof that resting is a win.", o: { b: "#d8a86a", l: "#e8c290", eyes: "sleepy", accs: ["acc_blanket"] } },
  // ── Mythic ──
  { kind: "composed", id: "drako", name: "Drako", species: "Baby dragon", category: "my", rarity: "event", source: "plus", glow: "rgba(110,156,186,.5)", blurb: "Hoards finished chapters like treasure.", o: { b: "#6f9cba", l: "#9ec7d8", k: "#ffd27d", ears: "ears_horns", belly: true, accs: ["acc_wing"] } },
  { kind: "composed", id: "pyra", name: "Pyra", species: "Phoenix chick", category: "my", rarity: "event", source: "plus", glow: "rgba(255,158,109,.55)", blurb: "Rises again after every missed day. No shame.", o: { b: "#ff9e6d", l: "#ffc7a0", k: "#ffd27d", ears: "ears_crest", mouth: "m_beak", accs: ["acc_wing"] } },
  { kind: "composed", id: "tama", name: "Tama", species: "Nine-tail fox", category: "my", rarity: "event", source: "plus", glow: "rgba(255,255,255,.5)", blurb: "Ancient, gentle, here for your finals.", o: { b: "#ffffff", l: "#ffffff", k: "#ff9e6d", ears: "ears_fox", accs: ["acc_tail", "acc_star"] } },
  { kind: "bespoke", id: "champi", name: "Champi", species: "Mushroom sprite", category: "my", rarity: "rare", source: "earned", glow: "rgba(224,88,78,.5)", blurb: "Sprouted from a well-rested mind.", grid: MUSH, palette: P_MUSH },
  { kind: "bespoke", id: "hopper", name: "Hopper", species: "Cactus bud", category: "my", rarity: "common", source: "free", glow: "rgba(111,156,110,.45)", blurb: "Thrives on neglect. Blooms when you return.", grid: CACTUS, palette: P_CACT },
];

const BY_ID: Record<string, CompanionEntry> = Object.fromEntries(COMPANIONS_DATA.map((e) => [e.id, e]));

export function listCompanions(): CompanionEntry[] {
  return COMPANIONS_DATA;
}
export function getCompanionEntry(id: string): CompanionEntry | undefined {
  return BY_ID[id];
}

export interface SpriteResult {
  grid: string[];
  palette: Palette;
  /** True for composed pets that carry the arm/leg rig; false for bespoke silhouettes. */
  limbed: boolean;
}

/**
 * Resolve a packId to its sprite grid + palette. `eyes` swaps the eye layer on composed
 * pets (the mood-driven expression seam); ignored by bespoke pets. Unknown ids (incl. the
 * legacy "sprout") fall back to the wisp so a stale persisted packId never blanks out.
 */
export function getCompanionSprite(packId: string, eyes?: EyeKey): SpriteResult {
  const e = BY_ID[packId];
  if (!e) {
    const w = COMPANION_SPRITES.wisp;
    return { grid: [...w.grid], palette: w.palette, limbed: false };
  }
  if (e.kind === "composed") {
    const { grid, palette } = composedSprite(e.o, eyes);
    return { grid, palette, limbed: true };
  }
  if (e.spriteKey) {
    const s = COMPANION_SPRITES[e.spriteKey];
    return { grid: [...s.grid], palette: s.palette, limbed: false };
  }
  return { grid: e.grid!, palette: e.palette!, limbed: false };
}

// ── Content-pack + shop generation (merged into the loader registries) ──────────────
const MOOD_MAP: Record<CompanionMood, string> = {
  idle: "idle", studying: "studying", celebrating: "celebrating", sleepy: "sleepy",
  tired: "tired", resting: "resting", greeting: "greeting", welcomeBack: "welcomeBack",
};

/** A CompanionPack per pet — `builtin:` riveAsset keeps them on the pixel renderer. */
export function buildCompanionPacks(): CompanionPack[] {
  return COMPANIONS_DATA.map((e) => ({
    id: e.id,
    name: e.name,
    riveAsset: `builtin:${e.id}`,
    moodMap: MOOD_MAP,
    defaultVoicePackId: "gentle",
    rarity: e.rarity,
  }));
}

/** Map the mockup's free/earned/plus source onto the existing price + Plus-gate model. */
function economyFor(e: CompanionEntry): { price: number; requiresPlus: boolean } {
  if (e.source === "plus") return { price: 0, requiresPlus: true };
  if (e.source === "earned") return { price: e.rarity === "common" ? 120 : 300, requiresPlus: false };
  return { price: 0, requiresPlus: false }; // free
}

export function buildCompanionShopItems(): ShopItem[] {
  return COMPANIONS_DATA.map((e) => {
    const { price, requiresPlus } = economyFor(e);
    return {
      id: `shop_companion_${e.id}`,
      type: "companion",
      packId: e.id,
      name: e.name,
      description: e.blurb,
      price,
      requiresPlus,
      rarity: e.rarity,
    };
  });
}
