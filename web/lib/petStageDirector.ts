import type {
  CompanionMood,
  DecorPlacement,
  PetAction,
  PetActionOptions,
  PetActionSource,
  PetRouteRuntime,
  PetRouteStep,
  PetRuntimeState,
  PetTargetKind,
  ThemePack,
} from "@/lib/types";
import { petAnchorForKind, petAnchorsForTheme } from "@/lib/scene";

const PIXEL_TARGETS: Record<Exclude<PetTargetKind, "decor" | "random">, { x: number; y: number }> = {
  center: { x: 0.5, y: 0.5 },
  lamp: { x: 0.23, y: 0.68 },
  pond: { x: 0.76, y: 0.72 },
  quest: { x: 0.5, y: 0.2 },
  timer: { x: 0.5, y: 0.82 },
};

const IDLE_ACTIONS = ["idle_blink", "idle_look", "idle_stretch", "jump_squeak"];
const STUDY_ACTIONS = ["study_write", "study_open_book"];
const REST_ACTIONS = ["rest_curl", "fatigue_blanket"];

export const PET_ROUTES: Record<string, PetRouteStep[]> = {
  showtime: [
    { actionId: "room_enter_walk", targetX: 0.23, targetY: 0.64, durationMs: 520 },
    { actionId: "dance_twirl", targetX: 0.23, targetY: 0.64, durationMs: 900 },
    { actionId: "room_enter_walk", targetX: 0.78, targetY: 0.68, durationMs: 620 },
    { actionId: "dance_twirl", targetX: 0.78, targetY: 0.68, durationMs: 950 },
    { actionId: "jump_squeak", targetX: 0.5, targetY: 0.36, durationMs: 560 },
    { actionId: "dance_twirl", targetX: 0.5, targetY: 0.5, durationMs: 1100 },
  ],
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, Number.isFinite(n) ? n : 0.5));
}

function latestDecor(decorPlacements: DecorPlacement[], targetId?: string) {
  if (targetId) {
    const exact = decorPlacements.find((decor) => decor.id === targetId || decor.itemId === targetId);
    if (exact) return exact;
  }
  return decorPlacements
    .slice()
    .sort((a, b) => Date.parse(b.placedAt) - Date.parse(a.placedAt))[0];
}

function targetKindForAction(action: PetAction): PetTargetKind {
  if (action.targetKind) return action.targetKind;
  if (["study", "write", "pageTurn", "flow", "celebrateSmall", "celebrateBig"].includes(action.animation)) return "center";
  if (action.animation === "inspectDecor") return "decor";
  if (action.animation === "walk") return "random";
  if (action.animation === "rest" || action.animation === "tired") return "lamp";
  return "center";
}

function targetForKind({
  currentX,
  currentY,
  decorPlacements,
  kind,
  now,
  theme,
  targetId,
}: {
  currentX: number;
  currentY: number;
  decorPlacements: DecorPlacement[];
  kind: PetTargetKind;
  now: number;
  theme?: ThemePack;
  targetId?: string;
}) {
  const useSceneAnchors = theme?.renderer === "image";
  const anchors = petAnchorsForTheme(theme);
  if (kind === "decor") {
    const decor = latestDecor(decorPlacements, targetId);
    if (!decor) return useSceneAnchors ? anchors.decor : PIXEL_TARGETS.lamp;
    if (!useSceneAnchors) {
      return {
        x: clamp01(0.14 + decor.x * 0.72),
        y: clamp01(0.52 + decor.y * 0.28),
      };
    }
    return {
      x: clamp01(anchors.decor.x + (decor.x - 0.5) * 0.3),
      y: clamp01(anchors.decor.y + (decor.y - 0.5) * 0.18),
    };
  }
  if (kind === "random") {
    const step = ((Math.floor(now / 1000) % 7) + 1) / 8;
    if (!useSceneAnchors) {
      const x = currentX < 0.5 ? 0.58 + step * 0.26 : 0.16 + step * 0.24;
      const y = currentY < 0.58 ? 0.58 + step * 0.16 : 0.38 + step * 0.12;
      return { x: clamp01(x), y: clamp01(y) };
    }
    const from = currentX < 0.5 ? anchors.right : anchors.left;
    const to = currentY < 0.58 ? anchors.decor : anchors.rest;
    const x = from.x * (1 - step) + to.x * step;
    const y = from.y * (1 - step) + to.y * step;
    return { x: clamp01(x), y: clamp01(y) };
  }
  return useSceneAnchors ? petAnchorForKind(theme, kind) : PIXEL_TARGETS[kind];
}

export function getPetRoute(routeId: string): PetRouteStep[] | null {
  return PET_ROUTES[routeId] ?? null;
}

export function createPetRouteRuntime({
  routeId,
  now = Date.now(),
  source = "user",
}: {
  routeId: string;
  now?: number;
  source?: PetActionSource;
}): PetRouteRuntime | null {
  const route = getPetRoute(routeId);
  if (!route?.length) return null;
  return {
    routeId,
    stepIndex: 0,
    steps: route,
    startedAt: now,
    source,
  };
}

export function canStartPetRuntime({
  action,
  currentAction,
  currentRuntime,
  now = Date.now(),
  source = "system",
}: {
  action: PetAction;
  currentAction?: PetAction | null;
  currentRuntime?: PetRuntimeState | null;
  now?: number;
  source?: PetActionSource;
}) {
  if (!currentRuntime || currentRuntime.endsAt <= now) return true;
  if (source === "user") return true;
  if (currentAction?.interruptible === false && action.priority < currentAction.priority) return false;
  return true;
}

export function createPetRuntime({
  action,
  currentRuntime,
  decorPlacements,
  now = Date.now(),
  options = {},
  theme,
}: {
  action: PetAction;
  currentRuntime?: PetRuntimeState | null;
  decorPlacements: DecorPlacement[];
  now?: number;
  options?: PetActionOptions;
  theme?: ThemePack;
}): PetRuntimeState {
  const kind = targetKindForAction(action);
  const target =
    typeof options.targetX === "number" || typeof options.targetY === "number"
      ? {
          x: clamp01(options.targetX ?? currentRuntime?.targetX ?? 0.5),
          y: clamp01(options.targetY ?? currentRuntime?.targetY ?? 0.5),
        }
      : targetForKind({
          currentX: currentRuntime?.targetX ?? 0.5,
          currentY: currentRuntime?.targetY ?? 0.5,
          decorPlacements,
          kind,
          now,
          theme,
          targetId: options.targetId,
        });

  return {
    actionId: action.id,
    startedAt: now,
    endsAt: now + Math.max(120, options.durationMs ?? action.durationMs),
    targetX: target.x,
    targetY: target.y,
    source: options.source ?? "system",
    routeId: options.routeId,
    routeStepIndex: options.routeStepIndex,
    routeTotalSteps: options.routeTotalSteps,
  };
}

export function chooseAutonomousPetAction({
  decorCount,
  mood,
  now = Date.now(),
  prefersReducedMotion = false,
}: {
  decorCount: number;
  mood: CompanionMood;
  now?: number;
  prefersReducedMotion?: boolean;
}): string | null {
  if (prefersReducedMotion || mood === "tired") return null;
  if (mood === "studying") {
    return STUDY_ACTIONS[Math.floor(now / 4000) % STUDY_ACTIONS.length];
  }
  if (mood === "resting" || mood === "sleepy") {
    return REST_ACTIONS[Math.floor(now / 5000) % REST_ACTIONS.length];
  }
  const pool = decorCount > 0 ? ["decor_visit", ...IDLE_ACTIONS] : IDLE_ACTIONS;
  return pool[Math.floor(now / 3000) % pool.length];
}

export function nextAutonomousDelay(now = Date.now()) {
  return 10_000 + (now % 8_001);
}
