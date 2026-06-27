import type { ShopItem, UserProfile } from "@/lib/types";

/**
 * Entitlement SEAM (spec §6). V1 has no real billing — `hasPlus` is a stub that always
 * returns false. Wiring Stripe/RevenueCat later means changing only this one function;
 * everything else asks `canAccess()`. The core loop, one companion, basic world/music,
 * and the fatigue guard are NEVER gated — we monetize expression, not the warmth.
 */
export function hasPlus(_profile: UserProfile): boolean {
  // TODO(billing): replace with a real entitlement check (profile.entitlements.plus).
  void _profile;
  return false;
}

/** Can this user acquire/equip this item right now? */
export function canAccess(item: ShopItem, profile: UserProfile): boolean {
  if (!item.requiresPlus) return true;
  return hasPlus(profile);
}
