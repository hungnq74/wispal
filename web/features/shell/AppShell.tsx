"use client";

import { useWispalStore } from "@/lib/store/useWispalStore";
import { useSessionStore } from "@/lib/store/useSessionStore";
import { SessionProvider } from "@/features/session/SessionProvider";
import { ThemeProvider } from "@/features/world/ThemeProvider";
import { WorldCanvas } from "@/features/world/WorldCanvas";
import { CompanionView } from "@/features/companion/CompanionView";
import { IntentionPrompt } from "@/features/session/IntentionPrompt";
import { SessionTimer } from "@/features/session/SessionTimer";
import { CompletionCard } from "@/features/session/CompletionCard";
import { ReflectionPrompt } from "@/features/reflection/ReflectionPrompt";
import { TopBar } from "@/features/shell/TopBar";
import { OverlayHost } from "@/features/shell/OverlayHost";
import { Toast } from "@/features/shell/Toast";
import { DevPanel } from "@/features/shell/DevPanel";
import { SyncBoot } from "@/features/sync/SyncBoot";
import { NextQuestChip } from "@/features/planner/NextQuestChip";
import { AmbiencePlayer } from "@/features/ambience/AmbiencePlayer";

/** The phase-dependent panel beneath the companion: start → timer → completion. */
function BottomPanel() {
  const status = useSessionStore((s) => s.status);
  if (status === "running") return <SessionTimer />;
  if (status === "complete") return <CompletionCard />;
  return <IntentionPrompt />;
}

function Scene() {
  const hydrated = useWispalStore((s) => s.hydrated);

  return (
    <>
      <WorldCanvas />
      <TopBar />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-end gap-4 px-4 pb-10 pt-28 sm:justify-center">
        {hydrated ? (
          <>
            <NextQuestChip />
            <CompanionView />
            <BottomPanel />
          </>
        ) : (
          <div className="ds-glass px-6 py-4" style={{ color: "var(--ink-mut)" }}>
            waking your wisp…
          </div>
        )}
      </main>

      <ReflectionPrompt />
      <OverlayHost />
      <Toast />
      <DevPanel />
      <SyncBoot />
      <AmbiencePlayer />
    </>
  );
}

export function AppShell() {
  return (
    <ThemeProvider>
      <SessionProvider>
        <Scene />
      </SessionProvider>
    </ThemeProvider>
  );
}
