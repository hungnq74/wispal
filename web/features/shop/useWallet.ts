"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";

/** Thin selector over the wallet (spec §7 lists useWallet under /shop). */
export function useWallet() {
  const softCurrency = useWispalStore((s) => s.wallet.softCurrency);
  const spend = useWispalStore((s) => s.spendCurrency);
  const add = useWispalStore((s) => s.addCurrency);
  return { softCurrency, spend, add };
}
