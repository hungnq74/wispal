"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { getCompanionPack } from "@/features/content/loader";
import { PixelIcon, PixelSprite } from "@/features/design/pixel";
import { getCompanionSprite, type EyeKey } from "@/features/design/companions";
import { LimbedCompanion, type RigMode } from "@/features/companion/CompanionRig";
import { findPetAction } from "@/lib/petActions";
import { chooseAutonomousPetAction, nextAutonomousDelay } from "@/lib/petStageDirector";
import { useWispalStore } from "@/lib/store/useWispalStore";
import type { CompanionMood, PetAction, PetAnimation, PetExpression, PetProp, PetRuntimeState } from "@/lib/types";

const RIVE_PET_ASSET = "/rive/wispal_pet_v1.riv";
const RiveCompanionRenderer = dynamic(
  () => import("@/features/companion/RiveCompanionRenderer").then((mod) => mod.RiveCompanionRenderer),
  { ssr: false },
);

const UNIT = 10;
const RIG_UNIT = 9;

const ANIM_CLASS: Partial<Record<PetAnimation, string>> = {
  blink: "pet-action-blink",
  look: "pet-action-look",
  study: "pet-action-study",
  write: "pet-action-study",
  pageTurn: "pet-action-study",
  flow: "pet-action-flow",
  sleepy: "pet-action-sleepy",
  tired: "pet-action-tired",
  rest: "pet-action-rest",
  jump: "pet-action-jump",
  dance: "pet-action-dance",
  wave: "pet-action-wave",
  petReact: "pet-action-wiggle",
  gift: "pet-action-gift",
  celebrateSmall: "pet-action-celebrate",
  celebrateBig: "pet-action-celebrate-big",
  walk: "pet-action-walk",
  inspectDecor: "pet-action-inspect",
};

function moodClass(mood: CompanionMood) {
  if (mood === "celebrating") return "pet-mood-celebrating";
  if (mood === "sleepy") return "pet-mood-sleepy";
  if (mood === "tired") return "pet-mood-tired";
  if (mood === "resting") return "pet-mood-resting";
  if (mood === "studying") return "pet-mood-studying";
  return "pet-mood-idle";
}

/** Swap a composed pet's eye layer to read its mood; idle/study keep the pet's own eyes. */
function eyesForMood(mood: CompanionMood): EyeKey | undefined {
  if (mood === "sleepy" || mood === "resting" || mood === "tired") return "sleepy";
  if (mood === "celebrating") return "happy";
  return undefined;
}

/** Pick the limbed rig's animation mode from the active action, falling back to mood. */
function rigModeFor(mood: CompanionMood, action: PetAction | null): RigMode {
  if (action) {
    switch (action.animation) {
      case "walk":
      case "inspectDecor":
        return "walk";
      case "jump":
      case "celebrateSmall":
      case "gift":
        return "hop";
      case "dance":
      case "celebrateBig":
        return "dance";
      case "wave":
      case "look":
      case "petReact":
        return "wave";
      case "rest":
        return "rest";
      case "sleepy":
        return "sleepy";
      case "tired":
        return "tired";
      case "study":
      case "write":
      case "pageTurn":
      case "flow":
      case "blink":
        return "study";
    }
  }
  if (mood === "celebrating") return "dance";
  if (mood === "studying") return "study";
  if (mood === "sleepy") return "sleepy";
  if (mood === "tired") return "tired";
  if (mood === "resting") return "rest";
  return "idle";
}

function ParticleBurst({ action }: { action: PetAction | null }) {
  if (!action) return null;
  const celebratory = ["celebrateSmall", "celebrateBig", "gift", "dance", "petReact", "jump"].includes(action.animation);
  const quiet = ["rest", "tired", "walk", "inspectDecor"].includes(action.animation);
  if (!celebratory && !quiet) return null;

  const icon = celebratory ? "spark" : quiet && action.animation === "rest" ? "heart" : "note";
  const color = celebratory ? "var(--glow)" : quiet && action.animation === "rest" ? "var(--bloom)" : "var(--rest)";

  return (
    <div key={`${action.id}_particles`} className="pet-particles" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`pet-particle pet-particle-${i}`}>
          <PixelIcon name={icon} color={color} unit={2} />
        </span>
      ))}
    </div>
  );
}

function expressionFor(mood: CompanionMood, action: PetAction | null): PetExpression {
  if (action?.expression) return action.expression;
  if (mood === "studying") return "focused";
  if (mood === "sleepy" || mood === "resting") return "sleepy";
  if (mood === "tired") return "tired";
  if (mood === "celebrating") return "happy";
  return "neutral";
}

function sameRuntime(current: PetRuntimeState | null, expected: PetRuntimeState) {
  return (
    current?.actionId === expected.actionId &&
    current.startedAt === expected.startedAt &&
    current.routeId === expected.routeId &&
    current.routeStepIndex === expected.routeStepIndex
  );
}

function ExpressionOverlay({ expression, action }: { expression: PetExpression; action: PetAction | null }) {
  const showThought = action?.animation === "look" || action?.animation === "inspectDecor";
  return (
    <>
      <span className={`pet-face pet-expression-${expression}`} aria-hidden>
        <span className="pet-eye pet-eye-left" />
        <span className="pet-eye pet-eye-right" />
        <span className="pet-mouth" />
        <span className="pet-cheek pet-cheek-left" />
        <span className="pet-cheek pet-cheek-right" />
        {expression === "tired" ? <span className="pet-sweat" /> : null}
      </span>
      {showThought ? <span className="pet-thought" aria-hidden>{action?.targetKind === "decor" ? "!" : "?"}</span> : null}
    </>
  );
}

function PropOverlay({ prop }: { prop?: PetProp }) {
  if (!prop) return null;
  return <span className={`pet-prop pet-prop-${prop}`} aria-hidden />;
}

function PixelFallback({
  mood,
  packId,
  activeAction,
  activeRuntime,
  hovered,
  reducedMotion,
}: {
  mood: CompanionMood;
  packId: string;
  activeAction: PetAction | null;
  activeRuntime: PetRuntimeState | null;
  hovered: boolean;
  reducedMotion: boolean;
}) {
  const { grid, palette, limbed } = getCompanionSprite(packId, eyesForMood(mood));
  const actionClass = activeAction ? ANIM_CLASS[activeAction.animation] ?? "" : "";
  const routeClass = activeRuntime?.routeId ? "pet-positioner-route" : "";
  const expression = expressionFor(mood, activeAction);
  const targetX = activeRuntime?.targetX ?? 0.5;
  const targetY = activeRuntime?.targetY ?? 0.5;
  const tx = (targetX - 0.5) * 136;
  const ty = (targetY - 0.5) * 48;

  return (
    <div className="pet-fallback-stage">
      <div className="pet-stage-shadow" aria-hidden style={{ transform: `translate(${tx * 0.35}px, ${18 + ty * 0.18}px)` }} />
      <div
        className={`pet-positioner ${routeClass}`}
        data-pet-action={activeRuntime?.actionId ?? "idle"}
        data-route-id={activeRuntime?.routeId ?? undefined}
        data-route-step={activeRuntime?.routeStepIndex ?? undefined}
        data-route-total={activeRuntime?.routeTotalSteps ?? undefined}
        style={{ transform: `translate(${tx}px, ${ty}px)` }}
      >
        <div
          key={`${activeRuntime?.actionId ?? "idle"}_${activeRuntime?.startedAt ?? 0}`}
          className={`pet-sprite-wrap ${limbed ? "limbed" : ""} ${moodClass(mood)} ${actionClass} ${hovered ? "pet-hovered" : ""}`}
        >
          {limbed ? (
            <LimbedCompanion grid={grid} palette={palette} unit={RIG_UNIT} mode={rigModeFor(mood, activeAction)} />
          ) : (
            <>
              <PixelSprite grid={grid} palette={palette} unit={UNIT} />
              <ExpressionOverlay expression={expression} action={activeAction} />
            </>
          )}
          <PropOverlay prop={activeAction?.prop} />
          {mood === "sleepy" || mood === "tired" ? (
            <div className="pet-zzz">z<span>z</span></div>
          ) : null}
          {reducedMotion ? null : <ParticleBurst action={activeAction} />}
        </div>
      </div>
    </div>
  );
}

function PetControls() {
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const run = (event: MouseEvent<HTMLButtonElement>, trigger: Parameters<typeof triggerPetAction>[0]) => {
    event.stopPropagation();
    triggerPetAction(trigger, { source: "user" });
  };
  return (
    <div className="pet-controls" aria-label="Pet actions">
      <button type="button" title="Pet" onClick={(event) => run(event, "pet")}>
        <PixelIcon name="heart" color="var(--bloom)" unit={2} />
      </button>
      <button type="button" title="Feed" onClick={(event) => run(event, "feed")}>
        <PixelIcon name="spark" color="var(--glow)" unit={2} />
      </button>
      <button type="button" title="Play" onClick={(event) => run(event, "play")}>
        <PixelIcon name="play" color="var(--wisp)" unit={2} />
      </button>
      <button type="button" title="Dance" onClick={(event) => run(event, "dance")}>
        <PixelIcon name="bolt" color="var(--ember)" unit={2} />
      </button>
    </div>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function CompanionRendererAdapter({
  mood,
  packId,
}: {
  mood: CompanionMood;
  packId: string;
}) {
  const companion = useWispalStore((s) => s.companion);
  const triggerPetAction = useWispalStore((s) => s.triggerPetAction);
  const completePetRuntime = useWispalStore((s) => s.completePetRuntime);
  const advancePetRoute = useWispalStore((s) => s.advancePetRoute);
  const [hovered, setHovered] = useState(false);
  const [pointerNear, setPointerNear] = useState(false);
  const [cursor, setCursor] = useState({ x: 0.5, y: 0.5 });
  const [riveReady, setRiveReady] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const pack = getCompanionPack(packId);
  const activeActionId = companion.activePetRuntime?.actionId;
  const activeAction = useMemo(
    () => (activeActionId ? findPetAction(activeActionId) ?? null : null),
    [activeActionId],
  );

  useEffect(() => {
    if (prefersReducedMotion) return;
    let cancelled = false;
    let timeout: number | null = null;
    const schedule = () => {
      timeout = window.setTimeout(() => {
        if (cancelled) return;
        const state = useWispalStore.getState();
        if (state.companion.activePetRoute) {
          schedule();
          return;
        }
        const actionId = chooseAutonomousPetAction({
          decorCount: state.world.decorPlacements.length,
          mood: state.companion.mood,
          now: Date.now(),
          prefersReducedMotion,
        });
        if (actionId) state.dispatchPetAction(actionId, { source: "system" });
        schedule();
      }, nextAutonomousDelay(Date.now()));
    };
    schedule();
    return () => {
      cancelled = true;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const runtime = companion.activePetRuntime;
    if (!runtime) return;
    if (runtime.routeId) return;
    const remaining = runtime.endsAt - Date.now();
    if (remaining <= 0) {
      const state = useWispalStore.getState();
      if (!sameRuntime(state.companion.activePetRuntime, runtime)) return;
      if (state.companion.activePetRoute && state.advancePetRoute()) return;
      state.completePetRuntime();
      return;
    }
    const id = window.setTimeout(() => {
      const state = useWispalStore.getState();
      if (!sameRuntime(state.companion.activePetRuntime, runtime)) return;
      if (state.companion.activePetRoute && state.advancePetRoute()) return;
      state.completePetRuntime();
    }, remaining);
    return () => window.clearTimeout(id);
  }, [advancePetRoute, companion.activePetRoute, companion.activePetRuntime, completePetRuntime]);

  useEffect(() => {
    let cancelled = false;
    void fetch(RIVE_PET_ASSET, { method: "HEAD" })
      .then((response) => {
        if (cancelled) return;
        if (response.ok) {
          setRiveReady(true);
        } else if (process.env.NODE_ENV !== "production") {
          console.warn(`Wispal Rive asset missing: ${RIVE_PET_ASSET}. Pixel fallback is active.`);
        }
      })
      .catch(() => {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`Wispal Rive asset missing: ${RIVE_PET_ASSET}. Pixel fallback is active.`);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const fallback: ReactNode = (
    <PixelFallback
      mood={mood}
      packId={packId}
      activeAction={activeAction}
      activeRuntime={companion.activePetRuntime}
      hovered={hovered}
      reducedMotion={prefersReducedMotion}
    />
  );

  return (
    <div
      className="pet-stage"
      onPointerEnter={() => {
        setHovered(true);
        setPointerNear(true);
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
        hoverTimer.current = window.setTimeout(() => triggerPetAction("hover", { source: "user" }), 360);
      }}
      onPointerLeave={() => {
        setHovered(false);
        setPointerNear(false);
        if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
      }}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCursor({
          x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
          y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
        });
      }}
      onClick={() => triggerPetAction("tap", { source: "user" })}
      aria-label={`companion: ${mood}`}
      role="img"
    >
      {riveReady ? (
        <RiveCompanionRenderer
          mood={mood}
          bondTier={companion.bondTier}
          needs={companion.petNeeds}
          activeAction={activeAction}
          activeActionAt={companion.activePetActionAt}
          activeRuntime={companion.activePetRuntime}
          roomX={companion.roomX}
          hovered={hovered}
          pointerNear={pointerNear}
          cursor={cursor}
          fallback={fallback}
        />
      ) : (
        fallback
      )}
      <PetControls />
      {pack?.riveAsset?.startsWith("builtin:") ? null : <span className="sr-only">Rive asset {pack?.riveAsset}</span>}
    </div>
  );
}
