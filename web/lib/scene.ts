import type {
  PetTargetKind,
  ScenePoint,
  ThemeBackgroundStage,
  ThemePack,
  ThemePetAnchors,
} from "@/lib/types";

export const GROWTH_STAGE_THRESHOLDS = [
  { stage: 0, minGrowth: 0 },
  { stage: 1, minGrowth: 1 },
  { stage: 2, minGrowth: 6 },
  { stage: 3, minGrowth: 15 },
  { stage: 4, minGrowth: 30 },
  { stage: 5, minGrowth: 60 },
] as const;

export const DEFAULT_PET_ANCHORS: ThemePetAnchors = {
  center: { x: 0.5, y: 0.5 },
  left: { x: 0.23, y: 0.64 },
  right: { x: 0.78, y: 0.68 },
  rest: { x: 0.32, y: 0.7 },
  decor: { x: 0.62, y: 0.64 },
  lamp: { x: 0.23, y: 0.68 },
  pond: { x: 0.76, y: 0.72 },
  quest: { x: 0.5, y: 0.2 },
  timer: { x: 0.5, y: 0.82 },
};

const LEGACY_THEME_FALLBACKS: Record<string, string> = {
  garden: "tokyo-night",
  night: "tokyo-night",
  "night-sky": "tokyo-night",
  "tokyo-night": "tokyo-night",
  morning: "dawn",
  cafe: "lofi",
  library: "academia",
};

function clamp01(value: number, fallback = 0.5) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

function normalizePoint(point: ScenePoint | undefined, fallback: ScenePoint): ScenePoint {
  return {
    x: clamp01(point?.x ?? fallback.x, fallback.x),
    y: clamp01(point?.y ?? fallback.y, fallback.y),
  };
}

export function resolveThemeId(id: string, availableIds: Iterable<string>): string {
  const ids = new Set(availableIds);
  if (ids.has(id)) return id;
  const fallback = LEGACY_THEME_FALLBACKS[id];
  if (fallback && ids.has(fallback)) return fallback;
  return ids.has("tokyo-night") ? "tokyo-night" : Array.from(ids)[0] ?? id;
}

export function stageForGrowth(
  growthPoints: number,
  stages: ReadonlyArray<{ stage: number; minGrowth: number }> = GROWTH_STAGE_THRESHOLDS,
) {
  const safeGrowth = Number.isFinite(growthPoints) ? Math.max(0, growthPoints) : 0;
  return stages.reduce((current, stage) => (safeGrowth >= stage.minGrowth ? stage : current), stages[0]);
}

export function backgroundStageForGrowth(
  theme: ThemePack | undefined,
  growthPoints: number,
): ThemeBackgroundStage | null {
  if (!theme?.backgroundStages?.length) return null;
  const safeStages = theme.backgroundStages
    .filter((stage) => Number.isFinite(stage.stage) && Number.isFinite(stage.minGrowth) && Boolean(stage.src))
    .slice()
    .sort((a, b) => a.minGrowth - b.minGrowth || a.stage - b.stage);
  if (!safeStages.length) return null;
  const target = stageForGrowth(growthPoints, safeStages);
  return safeStages.find((stage) => stage.stage === target.stage) ?? safeStages[0];
}

export function petAnchorsForTheme(theme: ThemePack | undefined): ThemePetAnchors {
  const anchors = theme?.petAnchors;
  return {
    center: normalizePoint(anchors?.center, DEFAULT_PET_ANCHORS.center),
    left: normalizePoint(anchors?.left, DEFAULT_PET_ANCHORS.left),
    right: normalizePoint(anchors?.right, DEFAULT_PET_ANCHORS.right),
    rest: normalizePoint(anchors?.rest, DEFAULT_PET_ANCHORS.rest),
    decor: normalizePoint(anchors?.decor, DEFAULT_PET_ANCHORS.decor),
    lamp: normalizePoint(anchors?.lamp, DEFAULT_PET_ANCHORS.lamp ?? DEFAULT_PET_ANCHORS.left),
    pond: normalizePoint(anchors?.pond, DEFAULT_PET_ANCHORS.pond ?? DEFAULT_PET_ANCHORS.right),
    quest: normalizePoint(anchors?.quest, DEFAULT_PET_ANCHORS.quest ?? DEFAULT_PET_ANCHORS.center),
    timer: normalizePoint(anchors?.timer, DEFAULT_PET_ANCHORS.timer ?? DEFAULT_PET_ANCHORS.center),
  };
}

export function petAnchorForKind(
  theme: ThemePack | undefined,
  kind: Exclude<PetTargetKind, "decor" | "random">,
): ScenePoint {
  const anchors = petAnchorsForTheme(theme);
  if (kind === "lamp") return anchors.lamp ?? anchors.left;
  if (kind === "pond") return anchors.pond ?? anchors.right;
  if (kind === "quest") return anchors.quest ?? anchors.center;
  if (kind === "timer") return anchors.timer ?? anchors.center;
  return anchors[kind];
}

export function validateThemePack(theme: ThemePack): string[] {
  const problems: string[] = [];
  if (!theme.id) problems.push("theme missing id");
  if (!theme.name) problems.push(`${theme.id} missing name`);
  if (theme.renderer !== "image" && theme.renderer !== "pixel") {
    problems.push(`${theme.id} has invalid renderer`);
  }
  if (theme.styleFamily !== "aesthetic" && theme.styleFamily !== "pixel") {
    problems.push(`${theme.id} has invalid styleFamily`);
  }
  if (!Array.isArray(theme.backgroundStages) || theme.backgroundStages.length !== 6) {
    problems.push(`${theme.id} must define exactly 6 background stages`);
  }
  const expected = GROWTH_STAGE_THRESHOLDS;
  for (const [index, expectedStage] of expected.entries()) {
    const stage = theme.backgroundStages?.[index];
    if (!stage) continue;
    if (stage.stage !== expectedStage.stage || stage.minGrowth !== expectedStage.minGrowth) {
      problems.push(`${theme.id} stage ${index} must be stage ${expectedStage.stage} at growth ${expectedStage.minGrowth}`);
    }
    if (!stage.src) problems.push(`${theme.id} stage ${index} missing src`);
    if (!stage.promptId) problems.push(`${theme.id} stage ${index} missing promptId`);
  }
  const anchors = petAnchorsForTheme(theme);
  for (const [name, point] of Object.entries(anchors)) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      problems.push(`${theme.id} anchor ${name} is invalid`);
    }
  }
  return problems;
}
