"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PixelIcon } from "@/features/design/pixel";
import { LimbedCompanion, type RigMode } from "@/features/companion/CompanionRig";
import { CompanionGallery } from "@/features/companion/CompanionGallery";
import { COMPANIONS_DATA, getCompanionSprite } from "@/features/design/companions";
import { useWispalStore } from "@/lib/store/useWispalStore";

const MODES: { label: string; mode: RigMode }[] = [
  { label: "Idle", mode: "idle" },
  { label: "Walk", mode: "walk" },
  { label: "Hop", mode: "hop" },
  { label: "Dance", mode: "dance" },
];

export default function CompanionsPage() {
  const [mode, setMode] = useState<RigMode>("walk");
  const packId = useWispalStore((s) => s.companion.packId);

  const limbedPets = useMemo(() => COMPANIONS_DATA.filter((p) => getCompanionSprite(p.id).limbed), []);
  const [animIdx, setAnimIdx] = useState(() => Math.max(0, limbedPets.findIndex((p) => p.id === packId)));
  const featured = limbedPets[((animIdx % limbedPets.length) + limbedPets.length) % limbedPets.length];
  const featuredSprite = getCompanionSprite(featured.id);

  return (
    <div style={{ minHeight: "100vh", padding: "40px 28px 72px", fontFamily: "var(--font-body)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* header */}
        <div className="flex items-end justify-between gap-5" style={{ flexWrap: "wrap" }}>
          <div>
            <Link href="/" className="ds-eyebrow" style={{ color: "var(--wisp)", textDecoration: "none" }}>
              ‹ Wispal · Companions
            </Link>
            <h1 style={{ font: "700 40px var(--font-pixel)", color: "var(--ink)", margin: "12px 0 0", textShadow: "0 0 24px rgba(143,184,240,.35)" }}>
              Companion Library
            </h1>
            <p style={{ font: "500 15px var(--font-body)", color: "var(--ink-dim)", margin: "10px 0 0", maxWidth: 600 }}>
              Thirty pixel souls, one house style. Pick your study buddy — every one drops in as a content pack, and the
              limbed ones walk, hop and dance right beside you.
            </p>
          </div>
          <div className="ds-card" style={{ padding: "10px 16px", textAlign: "center" }}>
            <div style={{ font: "700 22px var(--font-head)", color: "var(--ink)" }}>30</div>
            <div style={{ font: "600 9px var(--font-mono)", color: "var(--ink-mut)" }}>COMPANIONS</div>
          </div>
        </div>

        {/* library grid */}
        <div style={{ marginTop: 24 }}>
          <CompanionGallery minCardWidth={212} thumbUnit={5} />
        </div>

        {/* animator */}
        <div className="ds-eyebrow" style={{ color: "var(--wisp)", marginTop: 40 }}>Motion · the limbed rig in action</div>
        <div className="ds-card ds-card--night" style={{ marginTop: 14 }}>
          <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <button key={m.mode} onClick={() => setMode(m.mode)} className={`ds-pill ${mode === m.mode ? "ds-pill--active" : ""}`}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
              <button className="ds-btn-icon" aria-label="Previous" onClick={() => setAnimIdx((i) => i - 1)}>‹</button>
              <div style={{ minWidth: 124, textAlign: "center" }}>
                <div style={{ font: "600 15px var(--font-head)", color: "var(--ink)" }}>{featured.name}</div>
                <div style={{ font: "600 9px var(--font-mono)", color: "var(--ink-mut)", textTransform: "uppercase" }}>{featured.species}</div>
              </div>
              <button className="ds-btn-icon" aria-label="Next" onClick={() => setAnimIdx((i) => i + 1)}>›</button>
            </div>
          </div>

          {/* stage */}
          <div
            style={{
              position: "relative",
              height: 280,
              marginTop: 16,
              borderRadius: 16,
              overflow: "hidden",
              border: "2px solid var(--border)",
              background: "radial-gradient(120% 90% at 50% 0%, var(--surface-2), var(--page-0) 60%, var(--page-1))",
            }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, background: "linear-gradient(180deg, var(--surface), var(--page-1))", borderTop: "2px solid var(--border)" }} />
            <div style={{ position: "absolute", left: "50%", bottom: 54, width: 90, height: 14, marginLeft: -45, borderRadius: "50%", background: "rgba(0,0,0,.35)", filter: "blur(3px)" }} />
            <div style={{ position: "absolute", left: "50%", bottom: 60, transform: "translateX(-50%)", filter: `drop-shadow(0 0 14px ${featured.glow})` }}>
              <LimbedCompanion grid={featuredSprite.grid} palette={featuredSprite.palette} unit={11} mode={mode} />
            </div>
          </div>

          {/* troupe */}
          <div className="flex" style={{ flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "flex-end", marginTop: 18 }}>
            {limbedPets.slice(0, 8).map((p) => {
              const s = getCompanionSprite(p.id);
              return (
                <div key={p.id} style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ height: 96, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                    <LimbedCompanion grid={s.grid} palette={s.palette} unit={5} mode={mode} />
                  </div>
                  <div style={{ font: "600 11px var(--font-head)", color: "var(--ink)" }}>{p.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-6 text-center" style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>
          Wispal is always free. The rest monetize expression, never the loop — earn sparks by focusing and resting.
        </p>
      </div>
    </div>
  );
}
