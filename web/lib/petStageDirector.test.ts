import { describe, expect, it } from "vitest";
import { findPetAction } from "@/lib/petActions";
import {
  canStartPetRuntime,
  chooseAutonomousPetAction,
  createPetRouteRuntime,
  createPetRuntime,
  nextAutonomousDelay,
} from "@/lib/petStageDirector";
import type { DecorPlacement, PetRuntimeState } from "@/lib/types";

const decor: DecorPlacement[] = [
  {
    id: "lamp",
    itemId: "decor_lantern",
    x: 0.25,
    y: 0.1,
    scale: 1,
    placedAt: "2026-06-20T00:00:00.000Z",
  },
  {
    id: "cushion",
    itemId: "decor_cushion",
    x: 0.8,
    y: 0.4,
    scale: 1,
    placedAt: "2026-06-21T00:00:00.000Z",
  },
];

describe("pet stage director", () => {
  it("targets latest decor and centers study actions", () => {
    const decorVisit = findPetAction("decor_visit");
    const study = findPetAction("study_open_book");
    expect(decorVisit).toBeTruthy();
    expect(study).toBeTruthy();

    const runtime = createPetRuntime({ action: decorVisit!, decorPlacements: decor, now: 1000 });
    expect(runtime.targetX).toBeCloseTo(0.716);
    expect(runtime.targetY).toBeCloseTo(0.632);

    const studyRuntime = createPetRuntime({ action: study!, currentRuntime: runtime, decorPlacements: decor, now: 2000 });
    expect(studyRuntime.targetX).toBe(0.5);
    expect(studyRuntime.targetY).toBe(0.5);
  });

  it("creates route runtimes and lets route steps override targets", () => {
    const walk = findPetAction("room_enter_walk");
    expect(walk).toBeTruthy();

    const route = createPetRouteRuntime({ routeId: "showtime", now: 1234 });
    expect(route).toMatchObject({ routeId: "showtime", stepIndex: 0, source: "user" });
    expect(route?.steps.length).toBeGreaterThan(3);

    const step = route!.steps[0];
    const runtime = createPetRuntime({
      action: walk!,
      decorPlacements: decor,
      now: 2000,
      options: {
        targetX: step.targetX,
        targetY: step.targetY,
        durationMs: step.durationMs,
        routeId: route!.routeId,
        routeStepIndex: 0,
        routeTotalSteps: route!.steps.length,
      },
    });

    expect(runtime.targetX).toBe(step.targetX);
    expect(runtime.targetY).toBe(step.targetY);
    expect(runtime.endsAt).toBe(2000 + step.durationMs);
    expect(runtime.routeId).toBe("showtime");
    expect(runtime.routeStepIndex).toBe(0);
  });

  it("blocks lower-priority system actions during non-interruptible cutscenes", () => {
    const celebration = findPetAction("goal_big_dance");
    const blink = findPetAction("idle_blink");
    expect(celebration).toBeTruthy();
    expect(blink).toBeTruthy();

    const currentRuntime: PetRuntimeState = {
      actionId: "goal_big_dance",
      startedAt: 1000,
      endsAt: 3000,
      targetX: 0.5,
      targetY: 0.5,
      source: "system",
    };

    expect(
      canStartPetRuntime({
        action: blink!,
        currentAction: celebration,
        currentRuntime,
        now: 1500,
        source: "system",
      }),
    ).toBe(false);
    expect(
      canStartPetRuntime({
        action: blink!,
        currentAction: celebration,
        currentRuntime,
        now: 1500,
        source: "user",
      }),
    ).toBe(true);
  });

  it("suppresses autonomous behavior for reduced motion", () => {
    expect(chooseAutonomousPetAction({ decorCount: 2, mood: "idle", prefersReducedMotion: true })).toBeNull();
    expect(chooseAutonomousPetAction({ decorCount: 2, mood: "idle", now: 0 })).toBe("decor_visit");
    expect(nextAutonomousDelay(0)).toBe(10_000);
    expect(nextAutonomousDelay(8_000)).toBe(18_000);
  });
});
