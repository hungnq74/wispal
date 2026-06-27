"use client";

import { useMemo } from "react";
import { useWispalStore } from "@/lib/store/useWispalStore";
import { useUIStore } from "@/lib/store/useUIStore";
import { PixelIcon } from "@/features/design/pixel";

export function NextQuestChip() {
  const quests = useWispalStore((s) => s.quests);
  const subjects = useWispalStore((s) => s.subjects);
  const openOverlay = useUIStore((s) => s.openOverlay);

  const quest = useMemo(
    () =>
      quests.find((q) => q.status === "next") ??
      quests
        .filter((q) => q.status === "open")
        .sort((a, b) => a.sortOrder - b.sortOrder)[0],
    [quests],
  );
  const subject = quest?.subjectId ? subjects.find((s) => s.id === quest.subjectId) : null;

  return (
    <button
      type="button"
      onClick={() => openOverlay("quests")}
      className="ds-glass flex w-full max-w-md items-center gap-3 px-4 py-3 text-left"
      style={{ cursor: "pointer" }}
    >
      <PixelIcon name="note" color="var(--wisp)" unit={3} />
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ font: "600 14px var(--font-body)", color: "var(--ink)" }}>
          {quest ? quest.title : "Choose today's first quest"}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5" style={{ font: "500 11px var(--font-mono)", color: "var(--ink-mut)" }}>
          {subject && <i style={{ width: 8, height: 8, borderRadius: "50%", background: subject.color }} />}
          {subject?.name ?? (quest ? "no subject" : "quest board")}
        </span>
      </span>
    </button>
  );
}
