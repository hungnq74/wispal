"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/features/session/SessionProvider";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { Button, Pill, FieldLabel } from "@/features/design/kit";

const LENGTHS = [15, 25, 45];

/**
 * The 10-second intention + one-tap start. This is the landing's primary action, so
 * it's always visible and pre-filled — time-to-first-focus stays under a few seconds
 * (spec §1.3). Setting an intention is optional; you can just press start.
 */
export function IntentionPrompt() {
  const { start } = useSession();
  const preferred = useWispalStore((s) => s.profile.settings.preferredSessionLength);
  const quests = useWispalStore((s) => s.quests);
  const subjects = useWispalStore((s) => s.subjects);
  const [intention, setIntention] = useState("");
  const [minutes, setMinutes] = useState(
    LENGTHS.includes(preferred) ? preferred : 25,
  );
  const nextQuest = useMemo(
    () =>
      quests.find((q) => q.status === "next") ??
      quests
        .filter((q) => q.status === "open")
        .sort((a, b) => a.sortOrder - b.sortOrder)[0],
    [quests],
  );
  const subject = nextQuest?.subjectId ? subjects.find((s) => s.id === nextQuest.subjectId) : null;
  const startBlock = () =>
    start(intention.trim() || nextQuest?.title || "a focus block", minutes, {
      mode: "focus",
      questId: nextQuest?.id,
      subjectId: nextQuest?.subjectId ?? undefined,
    });

  return (
    <div className="ds-glass w-full max-w-md p-5">
      <FieldLabel>What are we working on?</FieldLabel>
      <input
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") startBlock();
        }}
        placeholder={nextQuest?.title ?? "e.g. finish the biology chapter"}
        autoFocus
        className="ds-input"
      />
      {nextQuest && (
        <div className="mt-2 flex items-center gap-2" style={{ font: "500 12px var(--font-body)", color: "var(--ink-dim)" }}>
          <span>linked to:</span>
          <span style={{ color: "var(--wisp)" }}>{nextQuest.title}</span>
          {subject && <span style={{ color: subject.color }}>{subject.name}</span>}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        {LENGTHS.map((m) => (
          <Pill key={m} active={minutes === m} onClick={() => setMinutes(m)}>
            {m} min
          </Pill>
        ))}
        <span className="ml-auto">
          <Button variant="primary" icon="play" onClick={startBlock}>
            Start
          </Button>
        </span>
      </div>
    </div>
  );
}
