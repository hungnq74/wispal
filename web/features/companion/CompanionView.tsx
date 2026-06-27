"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { useCompanionUI } from "@/features/companion/useCompanionFSM";
import { CompanionRendererAdapter } from "@/features/companion/CompanionRendererAdapter";

/**
 * The companion. V1 renders a pixel sprite (drawn on the same grid as the logo) whose
 * animation, glow and overlays are driven by mood; the companion pack's `moodMap` is the
 * seam where a Rive state machine drops in later (CompanionPack.riveAsset → a .riv file
 * from Supabase Storage). No frontier model is involved — expressions are data-driven,
 * words come from content packs.
 */

export function CompanionView() {
  const mood = useWispalStore((s) => s.companion.mood);
  const packId = useWispalStore((s) => s.companion.packId);
  const line = useCompanionUI((s) => s.line);

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

      <CompanionRendererAdapter mood={mood} packId={packId} />

      {/* soft shadow on the ground */}
      <div style={{ width: 90, height: 12, borderRadius: "50%", background: "rgba(10,8,28,0.35)", filter: "blur(4px)", marginTop: -6 }} />
    </div>
  );
}
