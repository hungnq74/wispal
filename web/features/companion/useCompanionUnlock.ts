"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { useWallet } from "@/features/shop/useWallet";
import { canAccess } from "@/features/entitlement/canAccess";
import { newId } from "@/lib/store/defaults";
import type { ShopItem } from "@/lib/types";

/**
 * The single unlock + equip flow, shared by the Shop and the Companions route.
 * Mirrors the spec's monetisation rule: the loop is never sold, only expression, and
 * Plus-gated items route through `canAccess()` (the entitlement seam). Extracted from
 * Shop.onAction so both surfaces stay in lockstep (prices, ownership, equip side-effects).
 */
export function useShopActions() {
  const { softCurrency, spend } = useWallet();
  const profile = useWispalStore((s) => s.profile);
  const inventory = useWispalStore((s) => s.inventory);
  const companion = useWispalStore((s) => s.companion);
  const world = useWispalStore((s) => s.world);
  const grantItem = useWispalStore((s) => s.grantItem);
  const setTheme = useWispalStore((s) => s.setTheme);
  const setVoicePack = useWispalStore((s) => s.setVoicePack);
  const setCompanionPack = useWispalStore((s) => s.setCompanionPack);
  const equipCosmetic = useWispalStore((s) => s.equipCosmetic);
  const placeDecor = useWispalStore((s) => s.placeDecor);
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const flash = useUIStore((s) => s.flash);

  const isOwned = (item: ShopItem) => inventory.some((i) => i.id === item.id);

  const isEquipped = (item: ShopItem) => {
    if (item.type === "theme") return world.themeId === item.packId;
    if (item.type === "companion") return companion.packId === item.packId;
    if (item.type === "voicePack") return companion.voicePackId === item.packId;
    if (item.type === "cosmetic") return companion.equippedCosmetics.includes(item.packId);
    if (item.type === "decor") return world.decorPlacements.some((d) => d.itemId === item.packId);
    if (item.type === "actionPack") return isOwned(item);
    return false;
  };

  const accessible = (item: ShopItem) => canAccess(item, profile);

  const applyEquip = (item: ShopItem) => {
    if (item.type === "theme") setTheme(item.packId);
    else if (item.type === "companion") setCompanionPack(item.packId);
    else if (item.type === "voicePack") setVoicePack(item.packId);
    else if (item.type === "cosmetic") equipCosmetic(item.packId);
    else if (item.type === "actionPack") triggerPetAction("gift", { source: "user" });
    else if (item.type === "decor") {
      placeDecor({
        id: newId(),
        itemId: item.packId,
        x: 0.2 + (world.decorPlacements.length % 4) * 0.18,
        y: world.decorPlacements.length % 2 ? 0.42 : 0.12,
        scale: 1,
        placedAt: new Date().toISOString(),
      });
    }
  };

  const onAction = (item: ShopItem) => {
    if (!accessible(item)) {
      flash("That one's part of Wispal Plus — coming soon ✦");
      return;
    }
    if (isOwned(item)) {
      applyEquip(item);
      return;
    }
    if (item.price > 0 && !spend(item.price)) {
      flash("Not quite enough sparks yet — keep going ✦");
      return;
    }
    grantItem({
      id: item.id,
      type: item.type,
      source: item.price > 0 ? "purchased" : "earned",
      acquiredAt: new Date().toISOString(),
    });
    applyEquip(item);
    flash(`${item.name} unlocked!`);
  };

  return { softCurrency, profile, companion, isOwned, isEquipped, accessible, applyEquip, onAction };
}
