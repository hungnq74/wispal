import { describe, expect, it } from "vitest";
import { listThemes } from "@/features/content/loader";
import {
  backgroundStageForGrowth,
  DEFAULT_PET_ANCHORS,
  petAnchorsForTheme,
  resolveThemeId,
  stageForGrowth,
  validateThemePack,
} from "@/lib/scene";
import type { ThemePack } from "@/lib/types";

describe("study scene packs", () => {
  it("maps growth points to the intended six stages", () => {
    expect(stageForGrowth(0).stage).toBe(0);
    expect(stageForGrowth(1).stage).toBe(1);
    expect(stageForGrowth(5).stage).toBe(1);
    expect(stageForGrowth(6).stage).toBe(2);
    expect(stageForGrowth(14).stage).toBe(2);
    expect(stageForGrowth(15).stage).toBe(3);
    expect(stageForGrowth(30).stage).toBe(4);
    expect(stageForGrowth(60).stage).toBe(5);
  });

  it("selects the highest available background stage at or below growth", () => {
    const theme = listThemes().find((pack) => pack.id === "cozy-fireplace");
    expect(backgroundStageForGrowth(theme, 0)?.stage).toBe(0);
    expect(backgroundStageForGrowth(theme, 7)?.stage).toBe(2);
    expect(backgroundStageForGrowth(theme, 61)?.stage).toBe(5);
  });

  it("validates all generated built-in packs", () => {
    const themes = listThemes();
    expect(themes).toHaveLength(16);
    expect(themes.filter((theme) => theme.styleFamily === "aesthetic")).toHaveLength(12);
    expect(themes.filter((theme) => theme.styleFamily === "pixel")).toHaveLength(4);
    expect(themes.flatMap(validateThemePack)).toEqual([]);
  });

  it("flags malformed stage contracts", () => {
    const broken = {
      ...listThemes()[0],
      backgroundStages: listThemes()[0].backgroundStages.slice(0, 5),
    } as ThemePack;
    expect(validateThemePack(broken)).toContain(`${broken.id} must define exactly 6 background stages`);
  });

  it("resolves legacy or missing theme ids safely", () => {
    const ids = listThemes().map((theme) => theme.id);
    expect(resolveThemeId("garden", ids)).toBe("tokyo-night");
    expect(resolveThemeId("not-real", ids)).toBe("tokyo-night");
    expect(resolveThemeId("cloud-loft", ids)).toBe("cloud-loft");
  });

  it("falls back to safe pet anchors when a theme is incomplete", () => {
    const anchors = petAnchorsForTheme(undefined);
    expect(anchors.center).toEqual(DEFAULT_PET_ANCHORS.center);
    expect(anchors.lamp).toEqual(DEFAULT_PET_ANCHORS.lamp);

    const partial = {
      ...listThemes()[0],
      petAnchors: {
        center: { x: 2, y: -1 },
        left: { x: 0.2, y: 0.6 },
        right: { x: 0.8, y: 0.6 },
        rest: { x: 0.4, y: 0.7 },
        decor: { x: 0.7, y: 0.62 },
      },
    } as ThemePack;
    expect(petAnchorsForTheme(partial).center).toEqual({ x: 1, y: 0 });
    expect(petAnchorsForTheme(partial).timer).toEqual(DEFAULT_PET_ANCHORS.timer);
  });
});
