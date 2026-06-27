"use client";

import { getShopCatalog } from "@/features/content/loader";
import { useShopActions } from "@/features/companion/useCompanionUnlock";
import { ItemCard } from "@/features/shop/ItemCard";
import { PixelIcon } from "@/features/design/pixel";
import type { ShopItem } from "@/lib/types";

/**
 * Shop: spend the sparks you earned by focusing (and resting). The fatigue guard and the
 * core loop are never sold here — only expression: ambiences, companions, voices. The
 * unlock/equip flow (incl. the Plus entitlement seam) lives in useShopActions, shared with
 * the Companions route.
 */
export function Shop() {
  const catalog = getShopCatalog();
  const { softCurrency, isOwned, isEquipped, accessible, onAction } = useShopActions();

  const renderItem = (item: ShopItem) => (
    <ItemCard
      key={item.id}
      item={item}
      owned={isOwned(item)}
      equipped={isEquipped(item)}
      locked={!accessible(item)}
      affordable={softCurrency >= item.price}
      onAction={() => onAction(item)}
    />
  );

  const themes = catalog.filter((i) => i.type === "theme");
  const companions = catalog.filter((i) => i.type === "companion" || i.type === "voicePack" || i.type === "cosmetic");
  const actionPacks = catalog.filter((i) => i.type === "actionPack");
  const decor = catalog.filter((i) => i.type === "decor");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Wisp shop</h2>
        <span className="ds-chip ds-chip--outline">
          <PixelIcon name="spark" color="var(--glow)" unit={3} /> {softCurrency}
        </span>
      </div>

      <div className="ds-eyebrow mb-2" style={{ color: "var(--wisp)" }}>Ambiences</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{themes.map(renderItem)}</div>

      <div className="ds-eyebrow mb-2 mt-6" style={{ color: "var(--wisp)" }}>Companions &amp; voices</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{companions.map(renderItem)}</div>

      <div className="ds-eyebrow mb-2 mt-6" style={{ color: "var(--wisp)" }}>Action packs</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{actionPacks.map(renderItem)}</div>

      <div className="ds-eyebrow mb-2 mt-6" style={{ color: "var(--wisp)" }}>Room decor</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{decor.map(renderItem)}</div>

      <p className="mt-5 text-center" style={{ font: "500 12px var(--font-body)", color: "var(--ink-mut)" }}>
        Earn sparks by finishing blocks, hitting your goal, and resting. Never by grinding.
      </p>
    </div>
  );
}
