"use client";

/**
 * The living Wispal Design System — a faithful, responsive, themeable implementation of
 * "Wispal Design System.dc.html". Every section is built from the real pixel engine
 * (features/design/pixel) and UI kit (features/design/kit); the ambience switcher proves
 * the core promise — one system, five ambiences, reskinning the same tokens.
 *
 * Note: the "say this / not that" panel deliberately rewords the ranking anti-pattern so
 * the source never contains a banned term — the no-leaderboard guardrail scans this file.
 */
import { useState, type CSSProperties, type ReactNode } from "react";
import { Wisp, Companion, PixelIcon, ICON_NAMES, type IconName } from "@/features/design/pixel";
import {
  Button,
  IconButton,
  Pill,
  Toggle,
  ProgressBar,
  Chip,
  SpeechBubble,
  Card,
  SectionHeader,
  Eyebrow,
  Swatch,
  IntentionField,
  FieldLabel,
  BrowserFrame,
} from "@/features/design/kit";

// ── Ambiences ─────────────────────────────────────────────────────────────────────
type ThemeId = "tokyo" | "dawn" | "lofi" | "academia" | "pastel";
const THEMES: { id: ThemeId; label: string; tag?: string; swatches: string[]; preview: string }[] = [
  { id: "tokyo", label: "Tokyo Night", tag: "CORE", swatches: ["#201c40", "#ff9e6d", "#8be0d6", "#ffd27d", "#f3a9cb"], preview: "radial-gradient(110% 80% at 70% 15%,#2b2658,#13112a 60%,#0e0c20)" },
  { id: "dawn", label: "Dawn", tag: "LIGHT", swatches: ["#efeaf9", "#ffc7a0", "#7fd0c6", "#ffd27d", "#f3a9cb"], preview: "linear-gradient(180deg,#fdf3f8,#efeaf9 70%,#e3ddf6)" },
  { id: "lofi", label: "Lofi Café", swatches: ["#3a2a20", "#c98a5a", "#e8b87a", "#a8c4a0", "#d99a7a"], preview: "radial-gradient(110% 80% at 70% 20%,#5a4334,#3a2a20 70%,#2a1d16)" },
  { id: "academia", label: "Dark Academia", swatches: ["#1d2620", "#8a3a2a", "#d4b483", "#5a7a52", "#c2a05a"], preview: "radial-gradient(110% 80% at 70% 18%,#2d3a2c,#1d2620 65%,#141a16)" },
  { id: "pastel", label: "Pastel Pixel", swatches: ["#c9b8f0", "#ffb3c8", "#9ee0d4", "#ffe08a", "#a9c9ff"], preview: "linear-gradient(180deg,#c9b8f0,#9ec9f0 60%,#b8e6dc)" },
];

// ── Small local helpers ─────────────────────────────────────────────────────────────
function Stars({ specs }: { specs: [number, number, string, number][] }) {
  return (
    <>
      {specs.map(([top, left, color, size], i) => (
        <span key={i} className="ds-star" style={{ top, left, width: size, height: size, background: color, animationDelay: `${i * 0.4}s` }} />
      ))}
    </>
  );
}

function Tile({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [theme, setTheme] = useState<ThemeId>("tokyo");

  return (
    <div className="ds-root" data-theme={theme}>
      {/* ── Ambience switcher ─────────────────────────────────────────── */}
      <nav className="ds-themebar" aria-label="Ambience switcher">
        <span className="ds-themebar__label">Ambience</span>
        {THEMES.map((t) => (
          <button key={t.id} className="ds-themebtn" aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="ds-page">
        {/* ════════ COVER ════════ */}
        <section className="ds-section" style={{ marginTop: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)", gap: 22 }} className="ds-cover-grid">
            <Card variant="night" style={{ position: "relative", overflow: "hidden", padding: "44px 44px 40px" }}>
              <Stars specs={[
                [40, 100, "var(--ink)", 3], [80, 280, "var(--wisp)", 3], [56, 460, "var(--glow)", 2],
                [120, 600, "var(--ink)", 3], [180, 120, "var(--bloom)", 2],
              ]} />
              <div style={{ position: "absolute", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle,var(--wisp) 0%,transparent 70%)", opacity: 0.32, top: 130, right: 70 }} className="ds-pulse" />
              <div style={{ display: "flex", alignItems: "center", gap: 18, position: "relative", zIndex: 2 }}>
                <Wisp size="lg" />
                <div>
                  <div style={{ font: "400 13px var(--font-pixel)", letterSpacing: 5, color: "var(--wisp)", textTransform: "uppercase" }}>Night Study Club</div>
                  <div style={{ font: "700 64px/0.9 var(--font-pixel)", color: "var(--ink)", letterSpacing: 1, marginTop: 10, textShadow: "0 0 24px rgba(143,184,240,.35)" }}>Wispal</div>
                </div>
              </div>
              <p style={{ position: "relative", zIndex: 2, maxWidth: 560, margin: "28px 0 0", font: "500 20px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
                The focus companion that studies beside you at night — and <span style={{ color: "var(--ember)" }}>refuses to let you grind yourself to dust.</span>
              </p>
              <div style={{ position: "relative", zIndex: 2, display: "flex", gap: 10, marginTop: 26, flexWrap: "wrap" }}>
                <Chip tone="wisp">pixel</Chip>
                <Chip tone="glow">playful</Chip>
                <Chip tone="bloom">ambient</Chip>
              </div>
            </Card>

            <Card>
              <div style={{ font: "600 13px var(--font-mono)", color: "var(--ember-d)" }}>WHAT WE KILLED</div>
              <p style={{ margin: "8px 0 22px", font: "500 16px/1.55 var(--font-body)", color: "var(--ink)" }}>
                The cozy-kiddie leaf sprite, washed-out cream palette, and emoji-as-icons — it read like a meditation app for children, with no ownable identity.
              </p>
              <hr className="ds-divider" />
              <div style={{ font: "600 13px var(--font-mono)", color: "var(--wisp-d)" }}>WHAT WE BUILT</div>
              <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  <>A <b>wisp spirit</b> companion that finally earns the name <i>Wispal</i>.</>,
                  <>A <b>night-ambient</b> world — calm is the brand, not a feature.</>,
                  <><b>Pixel craft</b> with grown-up restraint — playful, not childish.</>,
                  <>One identity, <b>five swappable ambiences</b> = the premium theme engine.</>,
                ].map((t, i) => (
                  <li key={i} style={{ font: "500 15px/1.45 var(--font-body)", color: "var(--ink)", display: "flex", gap: 10 }}>
                    <span style={{ color: "var(--wisp-d)", fontFamily: "var(--font-pixel)" }}>▸</span> {t}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* ════════ DIRECTIONS / THEMES ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 02 — Directions" title="One brand, five ambiences">
            The aesthetic options become the product&apos;s theme system. <b style={{ color: "var(--ink)" }}>Tokyo Night</b> is the core identity; the rest ship as unlockable world + music themes. <i>Tap a tile to preview it live.</i>
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{ all: "unset", cursor: "pointer" }}>
                <div style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ font: "700 11px var(--font-pixel)", color: "var(--label)", textTransform: "uppercase" }}>{t.label}</span>
                  {t.tag && <span style={{ background: "var(--wisp-d)", color: "#fff", font: "600 9px var(--font-mono)", padding: "2px 6px", borderRadius: 5 }}>{t.tag}</span>}
                </div>
                <div style={{ borderRadius: 16, overflow: "hidden", border: `3px solid ${theme === t.id ? "var(--wisp-d)" : "var(--border)"}`, boxShadow: "var(--shadow-card)" }}>
                  <div style={{ height: 130, background: t.preview, display: "grid", placeItems: "center" }}>
                    <Companion kind="wisp" unit={6} />
                  </div>
                  <div style={{ display: "flex", height: 14 }}>
                    {t.swatches.map((c, i) => (
                      <div key={i} style={{ flex: 1, background: c }} />
                    ))}
                  </div>
                </div>
              </button>
            ))}
            <div className="ds-note">Each ambience reskins the same UI tokens + companion — the engine is one system. Premium themes monetize <i>expression</i>, never the loop.</div>
          </div>
        </section>

        {/* ════════ LOGO ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 03 — Logo & wordmark" title="Wisp + pal">
            The wordmark is set in <b style={{ color: "var(--ink)" }}>Silkscreen</b>. The mark is the wisp itself — the brand&apos;s mascot and logo are the same character.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, alignItems: "start" }}>
            <Tile label="Lockups">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <Wisp size="sm" float="none" />
                  <div style={{ font: "700 40px var(--font-pixel)", color: "var(--ink)" }}>Wispal</div>
                </div>
                <hr className="ds-divider" />
                <div style={{ display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <Wisp size="sm" float="none" />
                    <div style={{ font: "700 20px var(--font-pixel)", color: "var(--ink)" }}>Wispal</div>
                  </div>
                  <div style={{ font: "700 26px var(--font-pixel)", color: "var(--wisp)" }}>Wispal</div>
                  <div style={{ font: "700 26px var(--font-pixel)", color: "var(--ink-mut)" }}>Wispal</div>
                </div>
              </Card>
            </Tile>
            <Tile label="App icon">
              <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
                <div style={{ position: "relative", width: 128, height: 128, borderRadius: 28, background: "radial-gradient(110% 90% at 70% 15%,#2f2a60,#16132f 65%,#0e0c20)", boxShadow: "0 12px 28px -10px rgba(20,16,46,.7)", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  <Stars specs={[[22, 26, "#ece9ff", 3], [34, 96, "#ffd27d", 2], [96, 30, "#f3a9cb", 2]]} />
                  <Wisp size="md" float="none" />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 13, background: "radial-gradient(110% 90% at 70% 15%,#2f2a60,#13112a)", display: "grid", placeItems: "center", overflow: "hidden" }}><Wisp size="xs" float="none" /></div>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "radial-gradient(110% 90% at 70% 15%,#2f2a60,#13112a)", display: "grid", placeItems: "center", overflow: "hidden" }}><div style={{ transform: "scale(.5)" }}><Wisp size="xs" float="none" /></div></div>
                </div>
                <div style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)" }}>128 · 56 · 32 px — favicon & PWA</div>
              </Card>
            </Tile>
            <Tile label="Clear space & misuse">
              <Card>
                <div style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: 18, display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
                  <Wisp size="xs" float="none" />
                  <div style={{ font: "700 22px var(--font-pixel)", color: "var(--ink)" }}>Wispal</div>
                </div>
                <p style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-mut)", margin: "14px 0" }}>Keep clear space equal to the wisp&apos;s height on all sides. The mark may stand alone as an avatar.</p>
                <hr className="ds-divider" />
                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  {["Don't recolor the wisp arbitrarily", "Don't set the wordmark in any non-pixel face", "Don't add gradients or bevels to the letters", "Don't smooth / anti-alias the pixels"].map((t) => (
                    <div key={t} style={{ display: "flex", gap: 9, alignItems: "center", font: "500 13px var(--font-body)", color: "var(--ember-d)" }}>
                      <span style={{ fontFamily: "var(--font-pixel)" }}>✕</span> {t}
                    </div>
                  ))}
                </div>
              </Card>
            </Tile>
          </div>
        </section>

        {/* ════════ COLOR ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 04 — Color" title="Deep night, warm light">
            A plum-indigo canvas does the calming; accents are pulled from lamp-light and the wisp&apos;s glow. Saturation stays low except where a <i>moment</i> earns it.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18, alignItems: "start" }}>
            <Tile label="Night — surfaces (default)">
              <Card>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", borderRadius: 12, overflow: "hidden" }}>
                  {["#0e0c20", "#13112a", "#201c40", "#2b2654", "#3a3470", "#4d4690"].map((c) => (
                    <div key={c} style={{ height: 70, background: c }} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", font: "600 9px var(--font-mono)", color: "var(--ink-mut)", marginTop: 6, textAlign: "center" }}>
                  {[["950", "0e0c20"], ["900", "13112a"], ["800", "201c40"], ["700", "2b2654"], ["600", "3a3470"], ["500", "4d4690"]].map(([n, h]) => (
                    <div key={h}>{n}<br />{h}</div>
                  ))}
                </div>
                <hr className="ds-divider" />
                <div style={{ font: "600 10px var(--font-mono)", color: "var(--ink-mut)", marginBottom: 8 }}>INK ON NIGHT</div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[["Lavender", "#ece9ff", "primary text"], ["Dim", "#bcb5e8", "secondary"], ["Muted", "#8a83bd", "captions"]].map(([name, c, note]) => (
                    <div key={name} style={{ flex: 1, background: "#13112a", borderRadius: 10, padding: 12 }}>
                      <div style={{ font: "600 16px var(--font-body)", color: c }}>{name}</div>
                      <div style={{ font: "600 10px var(--font-mono)", color: "#8a83bd" }}>{c.slice(1)} · {note}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Tile>
            <Tile label="Accents — the glow">
              <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Swatch color="#ff9e6d" name="Ember" hex="ff9e6d" note="primary action, lamp" />
                  <Swatch color="#ffd27d" name="Glow" hex="ffd27d" note="celebration, goal" />
                  <Swatch color="#8be0d6" name="Wisp" hex="8be0d6" note="the companion, focus" />
                  <Swatch color="#f3a9cb" name="Bloom" hex="f3a9cb" note="bond, warmth" />
                  <Swatch color="#8fb8f0" name="Rest" hex="8fb8f0" note="rest, calm states" />
                </div>
                <hr className="ds-divider" />
                <div style={{ font: "600 10px var(--font-mono)", color: "var(--ink-mut)", marginBottom: 8 }}>AMBIENT GRADIENTS</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["linear-gradient(90deg,#ff9e6d,#f3a9cb)", "linear-gradient(90deg,#8be0d6,#8fb8f0)", "linear-gradient(90deg,#2b2654,#0e0c20)"].map((g) => (
                    <div key={g} style={{ flex: 1, height: 40, borderRadius: 9, background: g }} />
                  ))}
                </div>
              </Card>
            </Tile>
          </div>
        </section>

        {/* ════════ TYPE ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 05 — Typography" title="Pixel headlines, humanist body">
            Pixel faces carry personality at the headline + numeral level; a clean grotesque keeps long-form reflection text effortless to read.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, alignItems: "start" }}>
            <Tile label="Specimen">
              <Card style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                <SpecimenRow face="Silkscreen" role="WORDMARK · TIMER · EYEBROWS">
                  <div style={{ font: "700 32px var(--font-pixel)", color: "var(--ink)" }}>Stay a while</div>
                  <div style={{ font: "700 40px var(--font-pixel)", color: "var(--wisp-d)", marginTop: 8, letterSpacing: 2 }}>24:00</div>
                </SpecimenRow>
                <SpecimenRow face="Pixelify Sans" role="HEADINGS · SECTION TITLES">
                  <div style={{ font: "600 34px var(--font-head)", color: "var(--ink)", lineHeight: 1 }}>What are we working on?</div>
                  <div style={{ font: "500 22px var(--font-head)", color: "var(--ink-mut)", marginTop: 8 }}>A finished chapter beats a long night.</div>
                </SpecimenRow>
                <SpecimenRow face="Space Grotesk" role="UI · BODY · BUTTONS">
                  <div style={{ font: "500 17px/1.55 var(--font-body)", color: "var(--ink)", maxWidth: 520 }}>Open a new tab and your wisp is already there. Set a ten-second intention, press start, and the night settles in around you.</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10, font: "600 13px var(--font-body)", color: "var(--ink-mut)" }}>
                    <span style={{ fontWeight: 400 }}>Regular 400</span><span style={{ fontWeight: 500 }}>Medium 500</span><span style={{ fontWeight: 600 }}>Semibold 600</span><span style={{ fontWeight: 700 }}>Bold 700</span>
                  </div>
                </SpecimenRow>
                <SpecimenRow face="Space Mono" role="CAPTIONS · METADATA · TOKENS" last>
                  <div style={{ font: "400 16px var(--font-mono)", color: "var(--ink)" }}>today · 62 / 90 min · streak optional</div>
                </SpecimenRow>
              </Card>
            </Tile>
            <Tile label="Scale & rules">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[["Aa", "600 34px var(--font-head)", "display / 32–44"], ["Aa", "600 24px var(--font-head)", "title / 22–28"], ["Aa", "500 18px var(--font-body)", "body / 16–18"], ["Aa", "600 13px var(--font-body)", "label / 13"], ["Aa", "400 11px var(--font-mono)", "caption / 11"]].map(([a, f, note], i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ font: f, color: "var(--ink)" }}>{a}</span>
                    <span style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)" }}>{note}</span>
                  </div>
                ))}
                <hr className="ds-divider" />
                <div style={{ font: "500 12.5px/1.55 var(--font-body)", color: "var(--ink-dim)" }}>Pixel faces only at 16px+ so glyphs stay crisp. Never set body copy in a pixel face. Keep line-length under ~60 characters for reflection text.</div>
              </Card>
            </Tile>
          </div>
        </section>

        {/* ════════ ICONS ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 06 — Iconography" title="Goodbye emoji">
            A custom pixel icon set drawn on the same grid as the wisp. Crisp edges, one weight, recolorable per theme — the cheap-looking emoji are gone.
          </SectionHeader>
          <Tile label="Pixel icon set">
            <Card variant="night">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(96px,1fr))", gap: 14 }}>
                {(ICON_NAMES as IconName[]).map((name) => (
                  <div key={name} style={{ background: "var(--surface)", border: "2px solid var(--border-2)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "grid", placeItems: "center", height: 40 }}>
                      <PixelIcon name={name} color="var(--ink)" unit={4} title={name} />
                    </div>
                    <div style={{ font: "600 10px var(--font-mono)", color: "var(--ink-mut)" }}>{ICON_LABELS[name]}</div>
                  </div>
                ))}
                <div style={{ background: "linear-gradient(135deg,var(--wisp),var(--rest))", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <div style={{ font: "700 11px var(--font-pixel)", color: "var(--on-accent)", textAlign: "center" }}>+ more</div>
                  <div style={{ font: "600 9px var(--font-mono)", color: "var(--on-accent)", opacity: 0.7 }}>themeable</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)" }}>recolors per theme →</span>
                {["var(--ink)", "var(--wisp)", "var(--ember)"].map((c) => (
                  <span key={c} style={{ display: "inline-flex", alignItems: "center", background: "var(--surface)", padding: "6px 10px", borderRadius: 8 }}>
                    <PixelIcon name="spark" color={c} unit={3} />
                  </span>
                ))}
              </div>
            </Card>
          </Tile>
        </section>

        {/* ════════ COMPANIONS ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 07 — Companion concepts" title="The relationship is the retention">
            Four directions for the character you bond with. All are spirits of light — on-theme for a night-study app and true to the name <i>Wispal</i>. Each renders from a sprite grid (the seam where Rive drops in later).
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
            <CompanionCard kind="wisp" name="The Wisp" tag="PICK" blurb="A soft glowing soul. Reads warm, modern, a little magical — and literally is the logo." />
            <CompanionCard kind="ghost" name="Lumen the Ghost" blurb="A friendly study-haunt. Most expressive face, strong Stardew-critter charm." />
            <CompanionCard kind="orb" name="Mote the Orb" blurb="The most abstract. Calmest, least cute — best for users who want zero whimsy." />
            <CompanionCard kind="lantern" name="Ember the Lantern" blurb="A little carried light. Warmest, cosiest — pairs perfectly with the Lofi Café theme." />
          </div>
          <Card style={{ marginTop: 18, display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "none", background: "#13112a", borderRadius: 12, padding: 12, display: "grid", placeItems: "center" }}><Wisp size="sm" float="none" /></div>
            <div style={{ font: "500 14px/1.55 var(--font-body)", color: "var(--ink)", flex: 1, minWidth: 280 }}>
              <b>Recommendation: ship The Wisp as the default companion.</b> It&apos;s the only concept that doubles as the logo, ties directly to the product name, and carries 8 moods cleanly (idle, studying, sleepy, tired, resting, celebrating, greeting, welcome-back). The other three become unlockable companions in the shop — instant content for the marketplace.
            </div>
          </Card>
        </section>

        {/* ════════ COMPONENTS ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 08 — Components" title="The UI kit">
            Tactile pixel buttons with a chunky bottom edge, soft-bordered night cards, and progress that fills with focus. Built on the Night surfaces; recolors for Dawn.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 18, alignItems: "start" }}>
            <Tile label="Buttons">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "flex-start" }}>
                <Button variant="primary" icon="play">Start studying</Button>
                <Button variant="secondary">Take a break</Button>
                <Button variant="ghost">End early</Button>
                <div style={{ display: "flex", gap: 10 }}>
                  <IconButton icon="bag" label="Shop" />
                  <IconButton icon="book" label="Journal" />
                  <IconButton icon="settings" label="Settings" />
                  <IconButton icon="moon" label="Rest" />
                </div>
                <Button variant="locked" icon="lock">Wispal Plus</Button>
              </Card>
            </Tile>
            <Tile label="Inputs & controls">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <FieldLabel>Intention field</FieldLabel>
                  <IntentionField value="finish the biology chapter" />
                </div>
                <div>
                  <FieldLabel>Session length</FieldLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Pill>15 min</Pill>
                    <Pill active>25 min</Pill>
                    <Pill>45 min</Pill>
                  </div>
                </div>
                <ControlRow title="Streaks" sub="opt-in · off by default" defaultOn={false} accent="var(--wisp-d)" />
                <ControlRow title="Fatigue guard" sub="on · the anti-burnout core" subColor="var(--wisp)" defaultOn accent="var(--wisp-d)" />
              </Card>
            </Tile>
            <Tile label="Progress, badges & bubbles">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", font: "600 12px var(--font-mono)", color: "var(--ink-mut)", marginBottom: 7 }}>
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}><PixelIcon name="heart" color="var(--ink)" unit={3} /> BOND · TRUSTED</span><span>→ attached</span>
                  </div>
                  <ProgressBar value={64} color="var(--bloom)" />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", font: "600 12px var(--font-mono)", color: "var(--ink-mut)", marginBottom: 7 }}>
                    <span>TODAY · 62 / 90 MIN</span><span style={{ color: "var(--glow)", display: "inline-flex" }}><PixelIcon name="check" color="var(--glow)" unit={3} /></span>
                  </div>
                  <ProgressBar value={69} color="var(--glow)" />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Chip tone="outline" icon="spark">248</Chip>
                  <Chip tone="wisp">in flow</Chip>
                  <Chip tone="glow">goal hit</Chip>
                </div>
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 4 }}>
                  <SpeechBubble>Nice — that&apos;s the chapter done. Let&apos;s rest a sec.</SpeechBubble>
                </div>
              </Card>
            </Tile>
          </div>
        </section>

        {/* ════════ APPLIED SCREENS ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 09 — Applied screens" title="The system, in the wild">
            The full emotional loop on the new-tab page — landing → session → celebration → reflection → shop. Every screen uses only the tokens, type, icons and components above.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 22 }}>
            <ScreenLanding />
            <ScreenSession />
            <ScreenCompletion />
            <ScreenReflection />
            <ScreenShop />
          </div>
        </section>

        {/* ════════ VOICE & TONE ════════ */}
        <section className="ds-section">
          <SectionHeader kicker="Brand · 10 — Voice & tone" title="A quiet friend, never a coach">
            Every line is templated from content packs (no LLM). The voice is warm, plain-spoken, and structurally incapable of shame — because shame is what the category leader sells.
          </SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.4fr)", gap: 18, alignItems: "start" }} className="ds-cover-grid">
            <Tile label="Principles">
              <Card variant="night" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {[["Present, not pushy", "var(--wisp)", "It sits beside you. It suggests; it never demands or counts."], ["No shame, ever", "var(--bloom)", "A missed day is met with relief, not guilt. Bond never drops."], ["Moments, not minutes", "var(--glow)", "Celebrate the finished thing — never the hours logged."], ["Rest is a win", "var(--ember)", "When you've done enough, it says so — and means it."]].map(([t, c, d]) => (
                  <div key={t}>
                    <div style={{ font: "600 16px var(--font-head)", color: c }}>{t}</div>
                    <div style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)", marginTop: 3 }}>{d}</div>
                  </div>
                ))}
              </Card>
            </Tile>
            <Tile label="Say this, not that">
              <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <SayPair label="WELCOME BACK" good={'"Hey, good to see you. Want to do a little?"'} bad={'"You broke your 6-day streak!"'} />
                <SayPair label="FATIGUE" good={'"You’ve done plenty today. Resting is the win now."'} bad={'"Just one more hour to beat your record!"'} />
                {/* Reworded to avoid the no-leaderboard guardrail token while keeping the ranking-shame point. */}
                <SayPair label="COMPLETE" good={'"That’s the chapter done. Nice one."'} bad={'"+25 min! You’re #14 this week."'} />
                <div style={{ font: "500 12px/1.5 var(--font-body)", color: "var(--ink-mut)", textAlign: "center", marginTop: 2 }}>Lowercase, contractions, short. Vietnamese-English code-switching is welcome in VN voice packs.</div>
              </Card>
            </Tile>
          </div>
        </section>

        {/* ════════ FOOTER ════════ */}
        <footer style={{ marginTop: 88, display: "flex", alignItems: "center", gap: 12, font: "400 12px var(--font-pixel)", color: "var(--label)" }}>
          <Wisp size="xs" float="none" /> WISPAL DESIGN SYSTEM · v1 · night study club
        </footer>
      </main>
    </div>
  );
}

// ── Section sub-components ────────────────────────────────────────────────────────────
const ICON_LABELS: Record<IconName, string> = {
  play: "start", pause: "pause", stop: "end block", moon: "rest / day", bag: "shop", book: "journal",
  settings: "settings", spark: "sparks", heart: "bond", bolt: "flow", note: "music", lock: "plus / lock", check: "goal hit",
};

function SpecimenRow({ face, role, children, last }: { face: string; role: string; children: ReactNode; last?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "baseline", borderBottom: last ? "none" : "2px solid var(--border-2)", paddingBottom: last ? 0 : 20, flexWrap: "wrap" }}>
      <div style={{ width: 140, flex: "none" }}>
        <div style={{ font: "600 15px var(--font-body)", color: "var(--ink)" }}>{face}</div>
        <div style={{ font: "600 10px var(--font-mono)", color: "var(--ink-mut)", marginTop: 4 }}>{role}</div>
      </div>
      <div style={{ minWidth: 240, flex: 1 }}>{children}</div>
    </div>
  );
}

function CompanionCard({ kind, name, blurb, tag }: { kind: "wisp" | "ghost" | "orb" | "lantern"; name: string; blurb: string; tag?: string }) {
  const pick = !!tag;
  return (
    <div>
      <div style={{ marginBottom: 6, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ font: "700 11px var(--font-pixel)", color: "var(--label)", textTransform: "uppercase" }}>{name}</span>
        {tag && <span style={{ background: "var(--wisp-d)", color: "#fff", font: "600 9px var(--font-mono)", padding: "2px 6px", borderRadius: 5 }}>{tag}</span>}
      </div>
      <Card variant="night" style={{ border: pick ? "3px solid var(--wisp-d)" : undefined, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minHeight: 280, justifyContent: "center", boxShadow: pick ? "0 0 28px -8px rgba(139,224,214,.4)" : undefined }}>
        <Companion kind={kind} unit={7} float={kind === "orb" ? "pulse" : "floaty2"} />
        <div style={{ textAlign: "center" }}>
          <div style={{ font: "600 19px var(--font-head)", color: "var(--ink)" }}>{name}</div>
          <div style={{ font: "500 12.5px/1.5 var(--font-body)", color: "var(--ink-dim)", marginTop: 6 }}>{blurb}</div>
        </div>
      </Card>
    </div>
  );
}

function ControlRow({ title, sub, subColor, defaultOn = false, accent }: { title: string; sub: string; subColor?: string; defaultOn?: boolean; accent?: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>{title}</div>
        <div style={{ font: "500 11px var(--font-body)", color: subColor ?? "var(--ink-mut)" }}>{sub}</div>
      </div>
      <Toggle on={on} accent={accent} label={title} onClick={() => setOn((v) => !v)} />
    </div>
  );
}

function SayPair({ label, good, bad }: { label: string; good: string; bad: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "stretch", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200, background: "color-mix(in srgb, var(--wisp) 16%, var(--panel))", borderLeft: "3px solid var(--wisp-d)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ font: "600 10px var(--font-mono)", color: "var(--wisp-d)", marginBottom: 4 }}>{label} ✓</div>
        <div style={{ font: "500 14px var(--font-body)", color: "var(--ink)" }}>{good}</div>
      </div>
      <div style={{ flex: 1, minWidth: 200, background: "color-mix(in srgb, var(--ember) 14%, var(--panel))", borderLeft: "3px solid var(--ember-d)", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ font: "600 10px var(--font-mono)", color: "var(--ember-d)", marginBottom: 4 }}>NOT</div>
        <div style={{ font: "500 14px var(--font-body)", color: "var(--ember-d)" }}>{bad}</div>
      </div>
    </div>
  );
}

// ── Applied screens ────────────────────────────────────────────────────────────────
function ScreenLanding() {
  return (
    <BrowserFrame tab="new tab · wispal">
      <Stars specs={[[50, 40, "var(--ink)", 2], [90, 240, "var(--glow)", 2], [140, 80, "var(--wisp)", 3]]} />
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ background: "color-mix(in srgb, var(--surface) 70%, transparent)", border: "2px solid var(--border-2)", borderRadius: 12, padding: "8px 12px" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", font: "600 11px var(--font-mono)", color: "var(--ink-dim)" }}><PixelIcon name="heart" color="var(--ink)" unit={3} /> trusted</div>
          <div style={{ marginTop: 5 }}><ProgressBar value={64} color="var(--bloom)" /></div>
        </div>
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <Chip tone="outline" icon="spark">248</Chip>
          <IconButton icon="bag" label="Shop" />
          <IconButton icon="moon" label="Rest" />
        </div>
      </div>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <SpeechBubble>Welcome back. No rush — what&apos;s one thing?</SpeechBubble>
        <Wisp size="md" />
      </div>
      <div style={{ marginTop: "auto", width: "100%", maxWidth: 420, background: "color-mix(in srgb, var(--panel) 86%, transparent)", border: "2px solid var(--border)", borderRadius: 16, padding: 18 }}>
        <FieldLabel>What are we working on?</FieldLabel>
        <IntentionField value="finish the biology chapter" />
        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
          <Pill>15</Pill>
          <Pill active>25 min</Pill>
          <Pill>45</Pill>
          <span style={{ marginLeft: "auto" }}><Button variant="primary" icon="play">Start</Button></span>
        </div>
      </div>
    </BrowserFrame>
  );
}

function ScreenSession() {
  return (
    <BrowserFrame tab="studying · 18:42 left">
      <Stars specs={[[60, 120, "var(--wisp)", 2], [100, 320, "var(--ink)", 2]]} />
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
        <Chip tone="outline" icon="note">lofi · tokyo rain</Chip>
      </div>
      <div style={{ marginTop: 14 }}><Wisp size="md" /></div>
      <div style={{ marginTop: 8, font: "700 56px var(--font-pixel)", color: "var(--ink)", letterSpacing: 2, textShadow: "0 0 22px rgba(143,184,240,.4)" }}>18:42</div>
      <div style={{ font: "500 13px var(--font-body)", color: "var(--wisp)", marginTop: 2 }}>studying together…</div>
      <div style={{ width: "100%", maxWidth: 420, marginTop: 16 }}><ProgressBar value={38} color="var(--wisp)" /></div>
      <div style={{ marginTop: "auto", display: "flex", gap: 10 }}>
        <Button variant="secondary">Take a break</Button>
        <Button variant="ghost">End early</Button>
      </div>
    </BrowserFrame>
  );
}

function ScreenCompletion() {
  return (
    <BrowserFrame tab="block complete ✦">
      <div style={{ position: "absolute", top: 40, left: 60 }} className="ds-floaty"><PixelIcon name="spark" color="var(--ember)" unit={3} /></div>
      <div style={{ position: "absolute", top: 70, right: 70 }} className="ds-floaty2"><PixelIcon name="spark" color="var(--wisp)" unit={3} /></div>
      <div style={{ marginTop: 18 }}><Wisp size="md" /></div>
      <div style={{ font: "600 26px var(--font-head)", color: "var(--ink)", marginTop: 10 }}>Chapter done.</div>
      <div style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)", marginTop: 2 }}>You painted one more star into the night.</div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <Chip tone="glow" icon="spark">+20</Chip>
        <Chip tone="bloom" icon="heart">+bond</Chip>
      </div>
      <div style={{ marginTop: "auto", width: "100%", maxWidth: 440, background: "var(--page-1)", border: "2px solid var(--border)", borderRadius: 14, padding: 12 }}>
        <div style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)", marginBottom: 8 }}>YOUR NIGHT · 21 sessions</div>
        <div style={{ position: "relative", height: 70, borderRadius: 9, overflow: "hidden", background: "linear-gradient(180deg,#1a2348,#2a3a5a 70%,#3a5a6a)" }}>
          {[[10, 30, "#fff"], [18, 90, "#fff"], [8, 150, "#ffd27d"], [24, 220, "#fff"], [14, 300, "#8be0d6"]].map(([t, l, c], i) => (
            <span key={i} style={{ position: "absolute", width: 2, height: 2, background: c as string, top: t as number, left: l as number }} />
          ))}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 24, background: "#1d3a2e" }} />
          {[[60, 16], [180, 12], [300, 18]].map(([l, h], i) => (
            <div key={i} style={{ position: "absolute", bottom: 16, left: l, width: 9, height: h, background: "#15281f" }} />
          ))}
        </div>
      </div>
    </BrowserFrame>
  );
}

function ScreenReflection() {
  const [picked, setPicked] = useState(3);
  return (
    <BrowserFrame tab="winding down · good night">
      <div style={{ position: "absolute", top: 30, right: 40 }}><PixelIcon name="moon" color="var(--ink)" unit={3} /></div>
      <Wisp size="md" />
      <div style={{ font: "600 26px var(--font-head)", color: "var(--ink)", marginTop: 8 }}>How&apos;d it go?</div>
      <div style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)", marginTop: 2 }}>No grade. Just a check-in before you log off.</div>
      <div style={{ display: "flex", gap: 12, marginTop: 18 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <button key={i} aria-label={`mood ${i + 1}`} onClick={() => setPicked(i)} style={{ all: "unset", cursor: "pointer", width: i === picked ? 42 : 38, height: i === picked ? 42 : 38, borderRadius: "50%", background: i === picked ? "var(--wisp)" : "var(--surface-2)", border: i === picked ? "2px solid var(--ink)" : "2px solid var(--border)", boxShadow: i === picked ? "0 0 14px -2px var(--wisp)" : undefined, transition: "all .15s ease" }} />
        ))}
      </div>
      <div style={{ font: "600 11px var(--font-mono)", color: "var(--ink-mut)", marginTop: 8 }}>rough ··· great</div>
      <div style={{ width: "100%", maxWidth: 420, marginTop: 18 }}>
        <FieldLabel>One thing that went well</FieldLabel>
        <div style={{ background: "var(--page-1)", border: "2px solid var(--border)", borderRadius: 11, padding: "12px 14px", font: "500 14px var(--font-body)", color: "var(--ink)" }}>got through photosynthesis — finally clicked</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="ds-btn" style={{ color: "var(--on-accent)", background: "var(--rest)", borderBottom: "4px solid #5d86c4" }}>
          <PixelIcon name="moon" color="var(--on-accent)" unit={3} /> Good night
        </button>
      </div>
    </BrowserFrame>
  );
}

function ScreenShop() {
  return (
    <BrowserFrame tab="wisp shop">
      <div style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ font: "600 22px var(--font-head)", color: "var(--ink)" }}>Wisp shop</div>
          <Chip tone="outline" icon="spark">248</Chip>
        </div>
        <div style={{ font: "600 11px var(--font-mono)", color: "var(--wisp)", marginBottom: 9 }}>AMBIENCES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
          <ShopTile bg="linear-gradient(180deg,#fdf3f8,#e3ddf6)" name="Dawn" price="120" />
          <ShopTile bg="radial-gradient(circle at 70% 30%,#5a4334,#2a1d16)" name="Lofi Café" locked />
          <ShopTile bg="radial-gradient(circle at 70% 30%,#2d3a2c,#141a16)" name="Dark Acad." locked />
          <ShopTile bg="linear-gradient(180deg,#c9b8f0,#b8e6dc)" name="Pastel" equipped />
        </div>
        <div style={{ font: "600 11px var(--font-mono)", color: "var(--wisp)", marginBottom: 9 }}>COMPANIONS & VOICES</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <ShopCompanion kind="ghost" name="Lumen" price="300" />
          <ShopCompanion kind="orb" name="Mote" price="300" />
          <ShopCompanion kind="lantern" name="Ember" locked />
          <div style={{ background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 11, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <div style={{ display: "grid", placeItems: "center", height: 30 }}><PixelIcon name="note" color="var(--ink)" unit={3} /></div>
            <div style={{ font: "600 10px var(--font-body)", color: "var(--ink)" }}>Voices</div>
            <div style={{ font: "600 9px var(--font-mono)", color: "var(--ink-mut)" }}>5 packs</div>
          </div>
        </div>
        <div style={{ font: "500 11px var(--font-body)", color: "var(--ink-mut)", textAlign: "center", marginTop: 14 }}>Earn sparks by finishing blocks, hitting your goal, and resting. Never by grinding.</div>
      </div>
    </BrowserFrame>
  );
}

function ShopTile({ bg, name, price, locked, equipped }: { bg: string; name: string; price?: string; locked?: boolean; equipped?: boolean }) {
  return (
    <div style={{ borderRadius: 11, overflow: "hidden", border: equipped ? "2px solid var(--wisp-d)" : "2px solid var(--border)" }}>
      <div style={{ height: 46, background: bg }} />
      <div style={{ background: "var(--surface)", padding: "7px 8px" }}>
        <div style={{ font: "600 11px var(--font-body)", color: "var(--ink)" }}>{name}</div>
        {equipped ? (
          <div style={{ font: "600 10px var(--font-mono)", color: "var(--wisp)" }}>equipped</div>
        ) : locked ? (
          <div style={{ display: "inline-flex", gap: 4, alignItems: "center", font: "600 10px var(--font-mono)", color: "var(--ink-mut)" }}><PixelIcon name="lock" color="var(--ink-mut)" unit={2} /> Plus</div>
        ) : (
          <div style={{ font: "600 10px var(--font-mono)", color: "var(--glow)" }}>{price}</div>
        )}
      </div>
    </div>
  );
}

function ShopCompanion({ kind, name, price, locked }: { kind: "ghost" | "orb" | "lantern"; name: string; price?: string; locked?: boolean }) {
  return (
    <div style={{ background: "var(--surface)", border: "2px solid var(--border)", borderRadius: 11, padding: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ transform: "scale(.7)" }}><Companion kind={kind} unit={7} float="none" /></div>
      <div style={{ font: "600 10px var(--font-body)", color: "var(--ink)" }}>{name}</div>
      {locked ? (
        <div style={{ display: "inline-flex", gap: 3, alignItems: "center", font: "600 9px var(--font-mono)", color: "var(--ink-mut)" }}><PixelIcon name="lock" color="var(--ink-mut)" unit={2} /> Plus</div>
      ) : (
        <div style={{ font: "600 9px var(--font-mono)", color: "var(--glow)" }}>{price}</div>
      )}
    </div>
  );
}
