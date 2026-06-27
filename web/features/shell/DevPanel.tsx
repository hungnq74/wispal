"use client";

import { type ReactNode, useState } from "react";
import { useSession } from "@/features/session/SessionProvider";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useSessionStore } from "@/lib/store/useSessionStore";

const ACTION_PACK_IDS = [
  "shop_action_dance_pack",
  "shop_action_study_pose_pack",
  "shop_action_rest_pose_pack",
  "shop_action_celebration_pack",
];

function DevButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg px-2 py-1"
      style={{ background: "var(--surface-2)", color: "var(--ink)", font: "500 11px var(--font-body)", border: "1px solid var(--border)" }}
    >
      {children}
    </button>
  );
}

/**
 * Dev-only control panel — never ships to production. Lets us drive the loop without
 * waiting on real-world timers (great for the Preview MCP / manual verification).
 */
export function DevPanel() {
  const [open, setOpen] = useState(false);
  const { start, dispatch, closeDay, completeNow } = useSession();
  const addCurrency = useWispalStore((s) => s.addCurrency);
  const addGrowth = useWispalStore((s) => s.addGrowth);
  const grantItem = useWispalStore((s) => s.grantItem);
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const startPetRoute = useWispalStore((s) => s.startPetRoute);
  const companion = useWispalStore((s) => s.companion);
  const status = useSessionStore((s) => s.status);

  if (process.env.NODE_ENV === "production") return null;

  const runPet = (trigger: Parameters<typeof triggerPetAction>[0]) => triggerPetAction(trigger, { source: "user" });

  return (
    <div className="pointer-events-auto fixed bottom-3 right-3 z-50 text-right">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-full px-3 py-1.5"
        style={{ background: "var(--surface)", color: "var(--ink-dim)", font: "600 11px var(--font-mono)", border: "1px solid var(--border)" }}
      >
        {open ? "× dev" : "🛠 dev"}
      </button>
      {open && (
        <div
          className="mt-2 grid w-56 grid-cols-2 gap-1.5 rounded-xl p-2"
          style={{ background: "var(--panel)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}
        >
          <DevButton onClick={() => start("quick test", 0.1)}>▶ 6s block</DevButton>
          <DevButton onClick={completeNow}>✓ complete</DevButton>
          <DevButton onClick={() => dispatch("daily_goal_hit")}>🎯 goal</DevButton>
          <DevButton onClick={() => dispatch("flow_detected")}>🌟 flow</DevButton>
          <DevButton onClick={() => dispatch("fatigue_threshold")}>😴 fatigue</DevButton>
          <DevButton onClick={closeDay}>🌙 close day</DevButton>
          <DevButton onClick={() => addCurrency(50)}>＋50 ✦</DevButton>
          <DevButton onClick={() => addGrowth(5)}>＋5 growth</DevButton>
          <DevButton
            onClick={() => {
              const now = new Date().toISOString();
              for (const id of ACTION_PACK_IDS) {
                grantItem({ id, type: "actionPack", source: "earned", acquiredAt: now });
              }
            }}
          >
            unlock packs
          </DevButton>
          <DevButton onClick={() => dispatch("heartbeat_idle")}>😴 idle</DevButton>
          <DevButton onClick={() => dispatch("heartbeat_active")}>👀 active</DevButton>
          <DevButton onClick={() => runPet("tap")}>pet tap</DevButton>
          <DevButton onClick={() => runPet("hover")}>hover</DevButton>
          <DevButton onClick={() => runPet("pet")}>pet</DevButton>
          <DevButton onClick={() => runPet("feed")}>feed</DevButton>
          <DevButton onClick={() => runPet("play")}>play</DevButton>
          <DevButton onClick={() => runPet("dance")}>dance</DevButton>
          <DevButton onClick={() => runPet("wave")}>wave</DevButton>
          <DevButton onClick={() => runPet("jump")}>jump</DevButton>
          <DevButton onClick={() => runPet("gift")}>gift</DevButton>
          <DevButton onClick={() => runPet("equip")}>equip</DevButton>
          <DevButton onClick={() => runPet("rest")}>rest</DevButton>
          <DevButton onClick={() => runPet("reflection")}>reflect</DevButton>
          <DevButton onClick={() => runPet("quest_done")}>quest</DevButton>
          <DevButton onClick={() => runPet("room_enter")}>room</DevButton>
          <DevButton onClick={() => runPet("decor_visit")}>decor</DevButton>
          <DevButton onClick={() => startPetRoute("showtime")}>route</DevButton>
          <span className="col-span-2 text-center" style={{ font: "500 10px var(--font-mono)", color: "var(--ink-mut)" }}>
            status: {status} · energy {Math.round(companion.petNeeds.energy)} · room {companion.roomX.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
