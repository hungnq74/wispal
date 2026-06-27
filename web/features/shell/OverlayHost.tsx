"use client";

import { useUIStore } from "@/lib/store/useUIStore";
import { Shop } from "@/features/shop/Shop";
import { JournalView } from "@/features/reflection/JournalView";
import { Settings } from "@/features/shell/Settings";
import { QuestBoard } from "@/features/planner/QuestBoard";
import { AmbienceStudio } from "@/features/ambience/AmbienceStudio";
import { ReviewGarden } from "@/features/review/ReviewGarden";
import { RoomsPanel } from "@/features/rooms/RoomsPanel";

/** Hosts the sliding panels (shop / journal / settings) over the scene. */
export function OverlayHost() {
  const overlay = useUIStore((s) => s.overlay);
  const close = useUIStore((s) => s.closeOverlay);
  if (overlay === "none") return null;

  return (
    <div
      className="fixed inset-0 z-30 flex justify-end"
      style={{ background: "rgba(8,6,20,0.45)", backdropFilter: "blur(6px)" }}
      onClick={close}
    >
      <div
        className="h-full w-full max-w-lg overflow-y-auto p-5"
        style={{
          background: "var(--page-1)",
          borderLeft: "2px solid var(--border)",
          boxShadow: "var(--shadow)",
          animation: "drift 0.22s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="ds-chip ds-chip--outline mb-3 ml-auto block"
          style={{ cursor: "pointer" }}
        >
          Close ✕
        </button>
        {overlay === "shop" && <Shop />}
        {overlay === "journal" && <JournalView />}
        {overlay === "settings" && <Settings />}
        {overlay === "quests" && <QuestBoard />}
        {overlay === "ambience" && <AmbienceStudio />}
        {overlay === "recall" && <ReviewGarden />}
        {overlay === "rooms" && <RoomsPanel />}
      </div>
    </div>
  );
}
