"use client";

import type { ShopItem } from "@/lib/types";
import { PixelIcon, PixelSprite } from "@/features/design/pixel";
import { getCompanionSprite } from "@/features/design/companions";

const RARITY: Record<ShopItem["rarity"], string> = {
  common: "var(--ink-mut)",
  rare: "var(--wisp)",
  event: "var(--bloom)",
};

const THEME_PREVIEW: Record<string, string> = {
  "tokyo-night": "radial-gradient(circle at 70% 30%,#2b2658,#0e0c20)",
  dawn: "linear-gradient(180deg,#fdf3f8,#e3ddf6)",
  pastel: "linear-gradient(180deg,#c9b8f0,#b8e6dc)",
  lofi: "radial-gradient(circle at 70% 30%,#5a4334,#2a1d16)",
  academia: "radial-gradient(circle at 70% 30%,#2d3a2c,#141a16)",
};

export function ItemCard({
  item,
  owned,
  equipped,
  locked,
  affordable,
  onAction,
}: {
  item: ShopItem;
  owned: boolean;
  equipped: boolean;
  locked: boolean; // requires Plus and user doesn't have it
  affordable: boolean;
  onAction: () => void;
}) {
  const disabled = locked || (equipped && owned) || (!owned && !locked && item.price > 0 && !affordable);
  const companionSprite = item.type === "companion" ? getCompanionSprite(item.packId) : null;

  let cta: React.ReactNode;
  if (locked) cta = <><PixelIcon name="lock" color="var(--ink-mut)" unit={2} /> Plus</>;
  else if (owned && item.type === "actionPack") cta = "Unlocked";
  else if (owned) cta = equipped ? "Equipped" : "Equip";
  else if (item.price > 0) cta = <><PixelIcon name="spark" color={disabled ? "var(--ink-mut)" : "var(--on-accent)"} unit={2} /> {item.price}</>;
  else cta = "Get";

  return (
    <div className="ds-card flex flex-col" style={{ padding: 16, gap: 0 }}>
      <div className="flex items-center gap-3">
        {companionSprite && (
          <span style={{ width: 46, height: 46, display: "grid", placeItems: "center", flex: "none", filter: "drop-shadow(0 0 7px rgba(139,224,214,.4))" }}>
            <PixelSprite grid={companionSprite.grid} palette={companionSprite.palette} unit={3} />
          </span>
        )}
        {item.type === "theme" && (
          <span style={{ width: 40, height: 40, borderRadius: 9, background: THEME_PREVIEW[item.packId] ?? "var(--surface-2)", flex: "none", boxShadow: "inset 0 0 0 1px rgba(0,0,0,.15)" }} />
        )}
        {item.type === "voicePack" && (
          <span style={{ width: 40, height: 40, borderRadius: 9, background: "var(--surface-2)", display: "grid", placeItems: "center", flex: "none" }}>
            <PixelIcon name="note" color="var(--ink)" unit={3} />
          </span>
        )}
        {item.type === "decor" && (
          <span style={{ width: 40, height: 40, borderRadius: 9, background: "var(--surface-2)", display: "grid", placeItems: "center", flex: "none" }}>
            <PixelIcon name="spark" color="var(--glow)" unit={3} />
          </span>
        )}
        {item.type === "actionPack" && (
          <span style={{ width: 40, height: 40, borderRadius: 9, background: "var(--surface-2)", display: "grid", placeItems: "center", flex: "none" }}>
            <PixelIcon name="bolt" color="var(--wisp)" unit={3} />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate" style={{ font: "600 15px var(--font-body)", color: "var(--ink)" }}>{item.name}</h3>
          <span style={{ font: "600 10px var(--font-mono)", color: RARITY[item.rarity], textTransform: "uppercase", letterSpacing: 0.5 }}>
            {item.rarity}
          </span>
        </div>
      </div>

      <p className="mt-2 flex-1" style={{ font: "500 13px/1.45 var(--font-body)", color: "var(--ink-dim)" }}>{item.description}</p>

      <button
        onClick={onAction}
        disabled={disabled}
        title={locked ? "Part of Wispal Plus (coming soon)" : undefined}
        className="ds-btn mt-3"
        style={{
          fontSize: 14,
          padding: "9px 14px",
          ...(equipped
            ? { background: "color-mix(in srgb, var(--wisp) 22%, transparent)", color: "var(--wisp)", cursor: "default" }
            : disabled
              ? { background: "var(--surface)", color: "var(--ink-mut)", border: "2px solid var(--border-2)", cursor: "not-allowed" }
              : { background: "var(--ember)", color: "var(--on-accent)", borderBottom: "4px solid var(--ember-d)" }),
        }}
      >
        {cta}
      </button>
    </div>
  );
}
