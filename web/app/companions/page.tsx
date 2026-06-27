"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PixelSprite, PixelIcon } from "@/features/design/pixel";
import { LimbedCompanion, type RigMode } from "@/features/companion/CompanionRig";
import {
  COMPANIONS_DATA,
  CATEGORY_LABELS,
  getCompanionSprite,
  type CompanionCategory,
  type CompanionEntry,
} from "@/features/design/companions";
import { useShopActions } from "@/features/companion/useCompanionUnlock";
import { getShopCatalog } from "@/features/content/loader";
import type { ShopItem } from "@/lib/types";

const RARITY_COLOR: Record<CompanionEntry["rarity"], string> = {
  common: "var(--ink-mut)",
  rare: "var(--wisp)",
  event: "var(--glow)",
};

const SOURCE_LABEL: Record<CompanionEntry["source"], { label: string; color: string }> = {
  free: { label: "★ free", color: "var(--wisp)" },
  earned: { label: "◇ earned", color: "var(--ink-dim)" },
  plus: { label: "✦ plus", color: "var(--glow)" },
};

const MODES: { label: string; mode: RigMode }[] = [
  { label: "Idle", mode: "idle" },
  { label: "Walk", mode: "walk" },
  { label: "Hop", mode: "hop" },
  { label: "Dance", mode: "dance" },
];

const CATEGORIES: { label: string; key: CompanionCategory | "all" }[] = [
  { label: "All", key: "all" },
  { label: "Critters", key: "cr" },
  { label: "Aquatic", key: "aq" },
  { label: "Spirits", key: "sp" },
  { label: "Anime-style", key: "an" },
  { label: "Meme energy", key: "me" },
  { label: "Mythic", key: "my" },
];

function PetThumb({ id, mode, unit }: { id: string; mode: RigMode; unit: number }) {
  const sprite = getCompanionSprite(id);
  if (sprite.limbed) return <LimbedCompanion grid={sprite.grid} palette={sprite.palette} unit={unit} mode={mode} />;
  return (
    <span className="ds-floaty2" style={{ display: "inline-flex" }}>
      <PixelSprite grid={sprite.grid} palette={sprite.palette} unit={unit} />
    </span>
  );
}

export default function CompanionsPage() {
  const [filter, setFilter] = useState<CompanionCategory | "all">("all");
  const [mode, setMode] = useState<RigMode>("walk");
  const { softCurrency, companion, isOwned, isEquipped, accessible, onAction } = useShopActions();

  const shopByPack = useMemo(() => {
    const map: Record<string, ShopItem> = {};
    for (const item of getShopCatalog()) if (item.type === "companion") map[item.packId] = item;
    return map;
  }, []);

  const limbedPets = useMemo(() => COMPANIONS_DATA.filter((p) => getCompanionSprite(p.id).limbed), []);
  const equippedLimbedIdx = Math.max(0, limbedPets.findIndex((p) => p.id === companion.packId));
  const [animIdx, setAnimIdx] = useState(equippedLimbedIdx);
  const featured = limbedPets[((animIdx % limbedPets.length) + limbedPets.length) % limbedPets.length];

  const visible = filter === "all" ? COMPANIONS_DATA : COMPANIONS_DATA.filter((p) => p.category === filter);

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
          <div className="flex items-center gap-2">
            <span className="ds-chip ds-chip--outline">
              <PixelIcon name="spark" color="var(--glow)" unit={3} /> {softCurrency}
            </span>
            <div className="ds-card" style={{ padding: "10px 16px", textAlign: "center" }}>
              <div style={{ font: "700 22px var(--font-head)", color: "var(--ink)" }}>30</div>
              <div style={{ font: "600 9px var(--font-mono)", color: "var(--ink-mut)" }}>COMPANIONS</div>
            </div>
          </div>
        </div>

        {/* filter chips */}
        <div className="flex gap-2" style={{ flexWrap: "wrap", marginTop: 24 }}>
          {CATEGORIES.map((c) => {
            const count = c.key === "all" ? COMPANIONS_DATA.length : COMPANIONS_DATA.filter((p) => p.category === c.key).length;
            const active = filter === c.key;
            return (
              <button key={c.key} onClick={() => setFilter(c.key)} className={`ds-pill ${active ? "ds-pill--active" : ""}`}>
                {c.label} <span style={{ font: "600 11px var(--font-mono)", opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(212px, 1fr))",
            gap: 16,
            marginTop: 22,
          }}
        >
          {visible.map((pet) => {
            const item = shopByPack[pet.id];
            const equipped = item ? isEquipped(item) : companion.packId === pet.id;
            const owned = item ? isOwned(item) : false;
            const locked = item ? !accessible(item) : false;
            const src = SOURCE_LABEL[pet.source];
            let cta = "Get";
            if (equipped) cta = "Equipped";
            else if (locked) cta = "Plus";
            else if (owned) cta = "Equip";
            else if (item && item.price > 0) cta = `✦ ${item.price}`;
            const disabled = equipped || locked || (!owned && !!item && item.price > softCurrency);
            return (
              <div key={pet.id} className="ds-card" style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
                <div style={{ position: "absolute", top: 10, left: 12, font: "600 9px var(--font-mono)", color: "var(--ink-mut)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {pet.species}
                </div>
                <div style={{ position: "absolute", top: 10, right: 12, font: "600 9px var(--font-mono)", color: RARITY_COLOR[pet.rarity], textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {pet.rarity}
                </div>
                <div
                  style={{
                    marginTop: 22,
                    width: 120,
                    height: 116,
                    borderRadius: 13,
                    background: "radial-gradient(110% 90% at 70% 15%, var(--surface-2), var(--page-1) 72%)",
                    border: "2px solid var(--border-2)",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  <span style={{ filter: `drop-shadow(0 0 7px ${pet.glow})` }}>
                    <PetThumb id={pet.id} mode="idle" unit={5} />
                  </span>
                </div>
                <div style={{ font: "600 17px var(--font-head)", color: "var(--ink)", marginTop: 12 }}>{pet.name}</div>
                <p style={{ font: "500 12px/1.4 var(--font-body)", color: "var(--ink-dim)", textAlign: "center", margin: "5px 0 0", minHeight: 34 }}>
                  {pet.blurb}
                </p>
                <div style={{ font: "600 10px var(--font-mono)", color: src.color, marginTop: 8 }}>{src.label}</div>
                <button
                  onClick={() => item && onAction(item)}
                  disabled={disabled || !item}
                  className="ds-btn mt-3"
                  style={{
                    width: "100%",
                    fontSize: 14,
                    padding: "9px 14px",
                    ...(equipped
                      ? { background: "color-mix(in srgb, var(--wisp) 22%, transparent)", color: "var(--wisp)", cursor: "default" }
                      : disabled
                        ? { background: "var(--surface)", color: "var(--ink-mut)", border: "2px solid var(--border-2)", cursor: "not-allowed" }
                        : { background: "var(--ember)", color: "var(--on-accent)", borderBottom: "4px solid var(--ember-d)" }),
                  }}
                >
                  {locked && !equipped ? (
                    <>
                      <PixelIcon name="lock" color="var(--ink-mut)" unit={2} /> {cta}
                    </>
                  ) : (
                    cta
                  )}
                </button>
              </div>
            );
          })}
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
              <LimbedCompanion grid={getCompanionSprite(featured.id).grid} palette={getCompanionSprite(featured.id).palette} unit={11} mode={mode} />
            </div>
          </div>

          {/* troupe */}
          <div className="flex" style={{ flexWrap: "wrap", gap: 10, justifyContent: "center", alignItems: "flex-end", marginTop: 18 }}>
            {limbedPets.slice(0, 8).map((p) => (
              <div key={p.id} style={{ width: 100, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                <div style={{ height: 96, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                  <LimbedCompanion grid={getCompanionSprite(p.id).grid} palette={getCompanionSprite(p.id).palette} unit={5} mode={mode} />
                </div>
                <div style={{ font: "600 11px var(--font-head)", color: "var(--ink)" }}>{p.name}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center" style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>
          Wispal is always free. The rest monetize expression, never the loop — earn sparks by focusing and resting.
        </p>
      </div>
    </div>
  );
}
