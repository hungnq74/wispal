/**
 * Wispal pixel engine — the foundation of the design system.
 *
 * Every mark in the brand (the wisp companion, the four unlockable companions, and the
 * 12-icon set) is drawn on a single low-res grid and rasterised to crisp SVG <rect>s.
 * This is a faithful port of the `px(grid, palette, unit)` renderer from
 * "Wispal Design System.dc.html" — one engine, recoloured per theme.
 *
 * `fill` accepts CSS variables, so icons recolour with the active ambience when you pass
 * e.g. color="var(--ink)". Companion sprites carry their own fixed palettes (the wisp is
 * always teal-glowing) exactly as specified in the design doc. This SVG grid is the seam
 * where a Rive renderer drops in later (CompanionPack.riveAsset) — no frontier model.
 */
import type { CSSProperties } from "react";

// ── Core rasteriser ───────────────────────────────────────────────────────────────
export type Palette = Record<string, string | undefined>;

export interface PixelSpriteProps {
  /** Rows of equal-width characters; each char keys into `palette`. "." (or any key
   *  missing from the palette) is transparent. */
  grid: string[];
  palette: Palette;
  /** Pixels per cell. */
  unit?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

/** Rasterise a character grid into crisp SVG rects — the design doc's `px()`. */
export function PixelSprite({ grid, palette, unit = 4, className, style, title }: PixelSpriteProps) {
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const fill = palette[row[x]];
      if (!fill) continue;
      rects.push(
        <rect key={`${x}_${y}`} x={x * unit} y={y * unit} width={unit} height={unit} fill={fill} />,
      );
    }
  }
  const w = (grid[0]?.length ?? 0) * unit;
  const h = grid.length * unit;
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={{ display: "block", ...style }}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

// ── Companion sprites (fixed palettes, per the design doc) ──────────────────────────
export const WISP_GRID = [
  "....oooo....",
  "...obllbo...",
  "..obllbbbo..",
  ".obllbbbbbo.",
  ".obbbbbbbbo.",
  ".obeebbeebo.",
  ".obeebbeebo.",
  ".obbbbbbbbo.",
  ".opbbmmbbpo.",
  ".obbbbbbbbo.",
  "..obbbbbbo..",
  "...obbbbo...",
  "....oooo....",
];
const PAL_WISP: Palette = { o: "#15233f", b: "#7fd9cf", l: "#c8f5ee", e: "#15233f", p: "#f3a9cb", m: "#15233f" };

export const GHOST_GRID = [
  "...oooo....",
  "..obbbbo...",
  ".obbbbbbo..",
  "obllbbbbbbo",
  "obbbbbbbbbo",
  "obeebbeebbo",
  "obeebbeebbo",
  "obbbbbbbbbo",
  "obbbmmbbbbo",
  "obbbbbbbbbo",
  "obbbbbbbbbo",
  "obo.obo.obo",
];
const PAL_GHOST: Palette = { o: "#2a2750", b: "#b8b3ee", l: "#e6e3ff", e: "#2a2750", m: "#2a2750" };

export const ORB_GRID = [
  "...oooo....",
  "..obbbbo...",
  ".obwlbbbbo.",
  "obllbbbbbbo",
  "obbbbbbbbbo",
  "obbbbbbbbbo",
  "obbbbbbbbbo",
  ".obbbbbbbo.",
  "..obbbbo...",
  "...oooo....",
];
const PAL_ORB: Palette = { o: "#3a2a55", b: "#caa6f0", l: "#efe2ff", w: "#ffffff" };

export const LANTERN_GRID = [
  "..g..g..",
  "..gssg..",
  ".oggggo.",
  "obbbbbbo",
  "obllllbo",
  "oblfflbo",
  "obffffbo",
  "oblfflbo",
  "obllllbo",
  "obbbbbbo",
  ".oggggo.",
];
const PAL_LANTERN: Palette = { o: "#3a2418", b: "#ff9e6d", l: "#ffd27d", f: "#fff2c2", g: "#c2914f", s: "#5a3a2a" };

// ── The wisp — the brand mark and default companion ─────────────────────────────────
const WISP_UNITS = { lg: 9, md: 6, sm: 4, xs: 3 } as const;
export type WispSize = keyof typeof WISP_UNITS;
type FloatAnim = "floaty" | "floaty2" | "pulse" | "none";

const FLOAT_CLASS: Record<FloatAnim, string> = {
  floaty: "ds-floaty",
  floaty2: "ds-floaty2",
  pulse: "ds-pulse",
  none: "",
};

export interface WispProps {
  size?: WispSize;
  glow?: boolean;
  float?: FloatAnim;
  className?: string;
  title?: string;
}

/** The wisp companion at the four canonical sizes (lg/md/sm/xs). */
export function Wisp({ size = "md", glow = true, float = "floaty", className, title = "Wispal, the wisp" }: WispProps) {
  return (
    <span
      className={`ds-sprite ${FLOAT_CLASS[float]} ${className ?? ""}`}
      style={glow ? { filter: "drop-shadow(0 0 10px rgba(139,224,214,.5))" } : undefined}
    >
      <PixelSprite grid={WISP_GRID} palette={PAL_WISP} unit={WISP_UNITS[size]} title={title} />
    </span>
  );
}

/** The three unlockable companions from the design doc (shop content). */
export const COMPANION_SPRITES = {
  wisp: { grid: WISP_GRID, palette: PAL_WISP },
  ghost: { grid: GHOST_GRID, palette: PAL_GHOST },
  orb: { grid: ORB_GRID, palette: PAL_ORB },
  lantern: { grid: LANTERN_GRID, palette: PAL_LANTERN },
} as const;
export type CompanionKey = keyof typeof COMPANION_SPRITES;

export function Companion({ kind, unit = 7, float = "floaty2", title }: { kind: CompanionKey; unit?: number; float?: FloatAnim; title?: string }) {
  const { grid, palette } = COMPANION_SPRITES[kind];
  return (
    <span className={`ds-sprite ${FLOAT_CLASS[float]}`}>
      <PixelSprite grid={grid} palette={palette} unit={unit} title={title ?? kind} />
    </span>
  );
}

// ── Icon set — a custom 9×9 pixel grid, recolourable per theme ──────────────────────
export const GLYPHS = {
  play: [".x.......", ".xx......", ".xxx.....", ".xxxx....", ".xxxxx...", ".xxxx....", ".xxx.....", ".xx......", ".x......."],
  pause: [".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx..", ".xx..xx.."],
  stop: [".........", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", "........."],
  moon: ["...xxx...", "..xx.....", ".xx......", ".xx......", ".xx......", ".xx......", ".xx......", "..xx.....", "...xxx..."],
  bag: ["..x...x..", ".xxx.xxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", ".xxxxxxx.", "..xxxxx..", "........."],
  book: [".xxx.xxx.", ".xxx.xxx.", ".xxx.xxx.", ".xxx.xxx.", ".xxx.xxx.", ".xxx.xxx.", ".xxx.xxx.", ".xxxxxxx.", "........."],
  settings: [".xxxxxxx.", "...x.....", ".........", ".xxxxxxx.", ".....x...", ".........", ".xxxxxxx.", "..x......", "........."],
  spark: ["....x....", "...xxx...", "..xxxxx..", ".xxxxxxx.", "..xxxxx..", "...xxx...", "....x....", ".........", "........."],
  heart: [".x...x...", "xxx.xxx..", "xxxxxxx..", "xxxxxxx..", ".xxxxx...", "..xxx....", "...x.....", ".........", "........."],
  bolt: ["....xx...", "...xx....", "..xx.....", ".xxxxx...", "...xx....", "..xx.....", ".xx......", ".........", "........."],
  note: [".....xx..", ".....xx..", ".....xx..", ".....xx..", "..x..xx..", ".xxx.xx..", ".xxx.x...", ".xx......", "........."],
  lock: ["..xxx....", ".x...x...", ".x...x...", "xxxxxxx..", "xxxxxxx..", "xxxxxxx..", "xxxxxxx..", "xxxxxxx..", "........."],
  check: [".......x.", "......xx.", ".....xx..", "x...xx...", "xx.xx....", ".xxx.....", "..x......", ".........", "........."],
} as const;

export type IconName = keyof typeof GLYPHS;
export const ICON_NAMES = Object.keys(GLYPHS) as IconName[];

export interface PixelIconProps {
  name: IconName;
  /** Any CSS colour — pass a var (e.g. "var(--ink)") to recolour with the theme. */
  color?: string;
  unit?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export function PixelIcon({ name, color = "currentColor", unit = 3, className, style, title }: PixelIconProps) {
  return <PixelSprite grid={[...GLYPHS[name]]} palette={{ x: color }} unit={unit} className={className} style={style} title={title} />;
}
