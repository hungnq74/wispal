"use client";

import { useMemo, useState } from "react";
import { PixelSprite, PixelIcon } from "@/features/design/pixel";
import { LimbedCompanion, type RigMode } from "@/features/companion/CompanionRig";
import {
  COMPANIONS_DATA,
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

const CATEGORIES: { label: string; key: CompanionCategory | "all" }[] = [
  { label: "All", key: "all" },
  { label: "Critters", key: "cr" },
  { label: "Aquatic", key: "aq" },
  { label: "Spirits", key: "sp" },
  { label: "Anime-style", key: "an" },
  { label: "Meme energy", key: "me" },
  { label: "Mythic", key: "my" },
];

/** A pet thumbnail — the limbed rig for composed pets, a floating sprite for bespoke ones. */
export function PetThumb({ id, mode = "idle", unit = 5 }: { id: string; mode?: RigMode; unit?: number }) {
  const sprite = getCompanionSprite(id);
  if (sprite.limbed) return <LimbedCompanion grid={sprite.grid} palette={sprite.palette} unit={unit} mode={mode} />;
  return (
    <span className="ds-floaty2" style={{ display: "inline-flex" }}>
      <PixelSprite grid={sprite.grid} palette={sprite.palette} unit={unit} />
    </span>
  );
}

/**
 * The companion library grid — category filter + equip/unlock cards. Shared by the full
 * /companions route and the slide-over picker so switching your buddy works the same way
 * from either surface. Equipping is instant (setCompanionPack), so the live scene updates
 * behind the panel.
 */
export function CompanionGallery({ minCardWidth = 200, thumbUnit = 5 }: { minCardWidth?: number; thumbUnit?: number }) {
  const [filter, setFilter] = useState<CompanionCategory | "all">("all");
  const { softCurrency, companion, isOwned, isEquipped, accessible, onAction } = useShopActions();

  const shopByPack = useMemo(() => {
    const map: Record<string, ShopItem> = {};
    for (const item of getShopCatalog()) if (item.type === "companion") map[item.packId] = item;
    return map;
  }, []);

  const visible = filter === "all" ? COMPANIONS_DATA : COMPANIONS_DATA.filter((p) => p.category === filter);

  return (
    <div>
      <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
          gap: 14,
          marginTop: 18,
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
            <div key={pet.id} className="ds-card" style={{ padding: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
              <div style={{ position: "absolute", top: 9, left: 11, font: "600 9px var(--font-mono)", color: "var(--ink-mut)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {pet.species}
              </div>
              <div style={{ position: "absolute", top: 9, right: 11, font: "600 9px var(--font-mono)", color: RARITY_COLOR[pet.rarity], textTransform: "uppercase", letterSpacing: 0.5 }}>
                {pet.rarity}
              </div>
              <div
                style={{
                  marginTop: 22,
                  width: 112,
                  height: 110,
                  borderRadius: 13,
                  background: "radial-gradient(110% 90% at 70% 15%, var(--surface-2), var(--page-1) 72%)",
                  border: "2px solid var(--border-2)",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                <span style={{ filter: `drop-shadow(0 0 7px ${pet.glow})` }}>
                  <PetThumb id={pet.id} mode="idle" unit={thumbUnit} />
                </span>
              </div>
              <div style={{ font: "600 16px var(--font-head)", color: "var(--ink)", marginTop: 11 }}>{pet.name}</div>
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
    </div>
  );
}
