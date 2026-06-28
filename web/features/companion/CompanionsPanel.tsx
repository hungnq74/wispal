"use client";

import Link from "next/link";
import { useUIStore } from "@/lib/store/useUIStore";
import { CompanionGallery } from "@/features/companion/CompanionGallery";

/**
 * The quick companion switcher — a slide-over picker over the live scene. Equipping is
 * instant, so your buddy changes on the main screen behind the panel. The full library
 * (with the animator) lives at /companions for a roomier browse.
 */
export function CompanionsPanel() {
  const close = useUIStore((s) => s.closeOverlay);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Your companions</h2>
        <Link
          href="/companions"
          onClick={close}
          className="ds-chip ds-chip--outline"
          style={{ textDecoration: "none", whiteSpace: "nowrap" }}
        >
          Library &amp; animator ›
        </Link>
      </div>
      <p className="mb-4" style={{ font: "500 13px/1.5 var(--font-body)", color: "var(--ink-dim)" }}>
        Tap Equip to bring a pet onto your night scene. Free ones are yours instantly; the rest you earn with sparks.
      </p>
      <CompanionGallery minCardWidth={150} thumbUnit={4} />
    </div>
  );
}
