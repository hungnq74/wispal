"use client";

import { useSessionStore } from "@/lib/store/useSessionStore";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useSession } from "@/features/session/SessionProvider";
import { nextMilestone } from "@/lib/world";
import { Button, Chip } from "@/features/design/kit";

/** Shown after a block completes — the celebration + an easy next step (or rest). */
export function CompletionCard() {
  const reset = useSessionStore((s) => s.reset);
  const session = useSessionStore((s) => s.session);
  const growth = useWispalStore((s) => s.world.growthPoints);
  const wallet = useWispalStore((s) => s.wallet.softCurrency);
  const completeQuest = useWispalStore((s) => s.completeQuest);
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const quest = useWispalStore((s) => s.quests.find((q) => q.id === session?.questId));
  const { closeDay } = useSession();

  const next = nextMilestone(growth);

  return (
    <div className="ds-glass w-full max-w-md p-6 text-center">
      <div style={{ font: "600 24px var(--font-head)", color: "var(--ink)" }}>Chapter done.</div>
      <p className="mt-1" style={{ font: "500 13px var(--font-body)", color: "var(--ink-dim)" }}>
        You painted one more star into the night.
        {next && ` ${next.at - growth} more to reach the ${next.label.toLowerCase()}.`}
      </p>

      <div className="mt-4 flex justify-center gap-2">
        <Chip tone="glow" icon="spark">
          {wallet} sparks
        </Chip>
        <Chip tone="bloom" icon="heart">
          +bond
        </Chip>
      </div>

      {quest && quest.status !== "done" && (
        <div className="mt-5 rounded-xl border-2 px-3 py-2 text-left" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <div style={{ font: "600 13px var(--font-body)", color: "var(--ink)" }}>{quest.title}</div>
          <div className="mt-2 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                completeQuest(quest.id);
                triggerPetAction("quest_done", { source: "user" });
                reset();
              }}
            >
              Quest done
            </Button>
            <Button variant="ghost" className="flex-1" onClick={reset}>
              Keep working
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="primary" className="flex-1" onClick={reset}>
          Start another
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            closeDay();
          }}
        >
          Call it a day
        </Button>
      </div>
    </div>
  );
}
