/**
 * Companion state machine — the heart (spec §4).
 *
 * A PURE function: (mood, signal, ctx) → { mood, dialogue, effects }. No I/O, no React,
 * no randomness — fully unit-testable. The hook layer (useCompanionFSM) applies the
 * effects to the store and resolves the dialogue trigger into actual words from a
 * content pack. Keeping this pure is what lets the same engine power other segments.
 */
import type {
  CompanionMood,
  FocusSignal,
  DialogueTrigger,
} from "@/lib/types";
import { BOND_AWARDS } from "@/lib/bond";
import { CURRENCY_AWARDS } from "@/lib/economy";

export interface FSMContext {
  /** Legacy settings carry this field, but the anti-burnout interrupt is enforced. */
  fatigueGuardEnabled: boolean;
  /** True at app_open if the user missed one or more days → welcomeBack, not greeting. */
  missedDay: boolean;
}

export interface SideEffects {
  bond: number;
  currency: number;
  growth: number;
  /** Open the evening reflection sheet (the journal disguised as care). */
  openReflection?: boolean;
  /** Queue a "morning gift" to hand over on the next first-open. */
  queueMorningGift?: boolean;
  /** celebrating auto-settles back to idle after this many ms. */
  autoSettleMs?: number;
  /** Marks that this transition rewarded rest (for analytics / copy). */
  rewardedRest?: boolean;
}

export interface FSMResult {
  mood: CompanionMood;
  dialogue: DialogueTrigger | null;
  effects: SideEffects;
}

const NO_EFFECTS: SideEffects = { bond: 0, currency: 0, growth: 0 };

const CELEBRATE_SETTLE_MS = 3000;

function result(
  mood: CompanionMood,
  dialogue: DialogueTrigger | null,
  effects: Partial<SideEffects> = {},
): FSMResult {
  return { mood, dialogue, effects: { ...NO_EFFECTS, ...effects } };
}

/** Is the companion in a state where a focus block is conceptually active? */
function isActive(mood: CompanionMood): boolean {
  return mood === "studying" || mood === "sleepy" || mood === "tired";
}

export function transition(
  mood: CompanionMood,
  signal: FocusSignal,
  ctx: FSMContext,
): FSMResult {
  switch (signal) {
    // First open of the day → warm greeting, or zero-shame welcome back.
    case "app_open": {
      if (ctx.missedDay) {
        return result("welcomeBack", "welcome_back", { bond: BOND_AWARDS.greeting });
      }
      return result("greeting", "greeting", { bond: BOND_AWARDS.greeting });
    }

    case "session_start": {
      // Only meaningful from a non-active state; otherwise ignore (already studying).
      if (isActive(mood) && mood !== "tired") return result(mood, null);
      return result("studying", "session_start");
    }

    case "heartbeat_idle": {
      // Soften into sleepy mid-session; no penalty, ever.
      if (mood === "studying") return result("sleepy", null);
      return result(mood, null);
    }

    case "heartbeat_active": {
      // Resume from sleepy seamlessly.
      if (mood === "sleepy") return result("studying", null);
      return result(mood, null);
    }

    case "flow_detected": {
      if (mood === "studying" || mood === "sleepy") {
        return result("studying", "flow", {
          bond: BOND_AWARDS.flow_detected,
          currency: CURRENCY_AWARDS.flow_detected,
        });
      }
      return result(mood, null);
    }

    case "session_complete": {
      // Completing a block is the core reward moment: celebrate + grow the world.
      return result("celebrating", "session_complete", {
        bond: BOND_AWARDS.session_complete,
        currency: CURRENCY_AWARDS.session_complete,
        growth: 1,
        autoSettleMs: CELEBRATE_SETTLE_MS,
      });
    }

    case "daily_goal_hit": {
      // Bigger celebration; the goal is bounded — you can only hit it once a day.
      return result("celebrating", "goal_hit", {
        bond: BOND_AWARDS.daily_goal_hit,
        currency: CURRENCY_AWARDS.daily_goal_hit,
        autoSettleMs: CELEBRATE_SETTLE_MS,
      });
    }

    case "fatigue_threshold": {
      // Anti-burnout INTERRUPT. Non-skippable in the product loop.
      void ctx.fatigueGuardEnabled;
      return result("tired", "fatigue_rest");
    }

    case "break_started": {
      // Resting is a win condition — it pays in bond + currency.
      return result("resting", null, {
        bond: BOND_AWARDS.rest,
        currency: CURRENCY_AWARDS.rest,
        rewardedRest: true,
      });
    }

    case "day_closed": {
      // Evening: settle to rest and open the reflection. The reward for the reflection
      // itself is granted when it's submitted (see useCompanionFSM.submitReflection).
      return result("resting", "reflection_prompt", {
        rewardedRest: true,
        openReflection: true,
        queueMorningGift: true,
      });
    }

    case "session_abandoned": {
      // Closed early. NO penalty — just settle back to idle.
      return result("idle", null);
    }

    default:
      return result(mood, null);
  }
}
