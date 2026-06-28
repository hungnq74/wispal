"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { useCompanionUI } from "@/features/companion/useCompanionFSM";
import { CompanionRendererAdapter } from "@/features/companion/CompanionRendererAdapter";
import { PixelIcon } from "@/features/design/pixel";
import { getCompanionEntry } from "@/features/design/companions";

/**
 * The companion. V1 renders a pixel sprite (drawn on the same grid as the logo) whose
 * animation, glow and overlays are driven by mood; the companion pack's `moodMap` is the
 * seam where a Rive state machine drops in later (CompanionPack.riveAsset → a .riv file
 * from Supabase Storage). No frontier model is involved — expressions are data-driven,
 * words come from content packs.
 *
 * A "switch buddy" chip sits right under the companion — the most direct entry point to
 * open the companion picker and change your pet without leaving the scene.
 */

export function CompanionView() {
  const mood = useWispalStore((s) => s.companion.mood);
  const packId = useWispalStore((s) => s.companion.packId);
  const line = useCompanionUI((s) => s.line);
  const openOverlay = useUIStore((s) => s.openOverlay);
  const name = getCompanionEntry(packId)?.name ?? "your buddy";

  return (
    <div className="flex select-none flex-col items-center gap-3">
      {/* speech bubble */}
      <div className="flex h-16 items-end">
        {line && (
          <div key={line} className="ds-bubble animate-pop-in">
            {line}
          </div>
        )}
      </div>

      <div className="companion-pet-slot">
        <CompanionRendererAdapter mood={mood} packId={packId} />

        {/* switch buddy — direct entry to the companion picker */}
        <button
          type="button"
          onClick={() => openOverlay("companions")}
          className="ds-chip ds-chip--outline companion-switch"
          title="Switch companion"
          aria-label={`Switch companion: ${name}`}
        >
          <PixelIcon name="spark" color="var(--wisp)" unit={2} />
          <span>Switch pet</span>
          <span className="companion-switch__name">{name}</span>
        </button>
      </div>
    </div>
  );
}
