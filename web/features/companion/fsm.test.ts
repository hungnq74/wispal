import { describe, it, expect } from "vitest";
import { transition, type FSMContext } from "./fsm";
import { tierForPoints, BOND_THRESHOLDS } from "@/lib/bond";

const guardOn: FSMContext = { fatigueGuardEnabled: true, missedDay: false };
const guardOff: FSMContext = { fatigueGuardEnabled: false, missedDay: false };

describe("companion FSM (spec §4)", () => {
  it("greets on first open, or welcomes back with NO shame after a missed day", () => {
    expect(transition("idle", "app_open", guardOn)).toMatchObject({
      mood: "greeting",
      dialogue: "greeting",
    });
    expect(
      transition("idle", "app_open", { fatigueGuardEnabled: true, missedDay: true }),
    ).toMatchObject({ mood: "welcomeBack", dialogue: "welcome_back" });
  });

  it("starts and runs a session; idle softens to sleepy and resumes with no penalty", () => {
    expect(transition("greeting", "session_start", guardOn).mood).toBe("studying");
    expect(transition("studying", "heartbeat_idle", guardOn).mood).toBe("sleepy");
    const resume = transition("sleepy", "heartbeat_active", guardOn);
    expect(resume.mood).toBe("studying");
    expect(resume.effects.bond).toBe(0); // resuming is never penalized or rewarded
  });

  it("celebrates a completed block: +currency, +1 growth, +bond, then auto-settles", () => {
    const r = transition("studying", "session_complete", guardOn);
    expect(r.mood).toBe("celebrating");
    expect(r.effects.growth).toBe(1);
    expect(r.effects.currency).toBeGreaterThan(0);
    expect(r.effects.bond).toBeGreaterThan(0);
    expect(r.effects.autoSettleMs).toBeGreaterThan(0);
  });

  it("FATIGUE GUARD: interrupts to tired even if a legacy setting says off", () => {
    expect(transition("studying", "fatigue_threshold", guardOn)).toMatchObject({
      mood: "tired",
      dialogue: "fatigue_rest",
    });
    expect(transition("studying", "fatigue_threshold", guardOff)).toMatchObject({
      mood: "tired",
      dialogue: "fatigue_rest",
    });
  });

  it("rewards rest — resting is a win condition (bond + currency)", () => {
    const r = transition("tired", "break_started", guardOn);
    expect(r.mood).toBe("resting");
    expect(r.effects.bond).toBeGreaterThan(0);
    expect(r.effects.currency).toBeGreaterThan(0);
    expect(r.effects.rewardedRest).toBe(true);
  });

  it("day_closed opens the reflection and queues a morning gift", () => {
    const r = transition("idle", "day_closed", guardOn);
    expect(r.mood).toBe("resting");
    expect(r.dialogue).toBe("reflection_prompt");
    expect(r.effects.openReflection).toBe(true);
    expect(r.effects.queueMorningGift).toBe(true);
  });

  it("abandoning a session carries no penalty", () => {
    const r = transition("studying", "session_abandoned", guardOn);
    expect(r.mood).toBe("idle");
    expect(r.effects.bond).toBe(0);
    expect(r.effects.currency).toBe(0);
  });
});

describe("bond progression", () => {
  it("is monotonic and reaches 'attached' only past its threshold", () => {
    expect(tierForPoints(0)).toBe("new");
    expect(tierForPoints(BOND_THRESHOLDS.attached - 1)).toBe("trusted");
    expect(tierForPoints(BOND_THRESHOLDS.attached)).toBe("attached");
    expect(tierForPoints(BOND_THRESHOLDS.bonded + 999)).toBe("bonded");
  });
});
