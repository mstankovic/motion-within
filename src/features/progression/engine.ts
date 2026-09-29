import type { TrackingMode } from "@/features/workout-session/types";

/**
 * Rule-based, explainable progression. Never an LLM, never applied automatically:
 * every suggestion needs explicit user confirmation.
 */

export const DEFAULT_STEP_KG = 2.5;
export const LONG_BREAK_DAYS = 14;
export const MAX_REPS_TARGET = 20;
const LOW_RPE = 7;
const VERY_HARD_SESSION_RPE = 9;

export type SuggestionType =
  | "increase_weight"
  | "harder_band"
  | "harder_trx"
  | "increase_reps"
  | "harder_variation"
  | "hold"
  | "reduce"
  | "return_easy";

export type ReasonCode =
  | "double_progression"
  | "double_progression_no_rpe"
  | "rpe_high"
  | "below_range"
  | "session_very_hard"
  | "after_break";

export type Suggestion = {
  type: SuggestionType;
  reasonCode: ReasonCode;
  reasonPayload: Record<string, string | number | null>;
  suggestedPayload: Record<string, string | number | null>;
  /** True when accepting would raise the load/target. */
  isIncrease: boolean;
};

export type PlanTarget = {
  trackingMode: TrackingMode;
  isMobility: boolean;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetWeightKg: number | null;
  targetBandLabel: string | null;
  targetTrxPosition: string | null;
  progressionStepKg: number | null;
  /** Duration progression only when the user opts in (not in MVP UI). */
  durationProgressionEnabled?: boolean;
};

export type PerformanceInput = {
  performedAt: string;
  status: "pending" | "completed" | "skipped";
  painFlag: boolean;
  sessionRpe: number | null;
  sets: {
    reps: number | null;
    weightKg: number | null;
    rpe: number | null;
    completed: boolean;
    isWarmup: boolean;
  }[];
};

const DAY_MS = 86_400_000;

function workingSets(p: PerformanceInput) {
  return p.sets.filter((s) => s.completed && !s.isWarmup);
}

function maxRpe(p: PerformanceInput): number | null {
  const rpes = workingSets(p)
    .map((s) => s.rpe)
    .filter((r): r is number => r != null);
  return rpes.length ? Math.max(...rpes) : null;
}

function hitTopOfRange(p: PerformanceInput, target: PlanTarget): boolean {
  const sets = workingSets(p);
  if (target.targetRepsMax == null) return false;
  return (
    sets.length >= target.targetSets && sets.every((s) => (s.reps ?? 0) >= target.targetRepsMax!)
  );
}

function round(value: number, step = 0.25) {
  return Math.round(value / step) * step;
}

/**
 * @param history completed performances of one exercise, newest first.
 */
export function evaluateProgression(
  target: PlanTarget,
  history: PerformanceInput[],
): Suggestion | null {
  if (target.isMobility) return null;
  if (target.trackingMode === "duration" && !target.durationProgressionEnabled) return null;

  const done = history.filter((p) => p.status === "completed");
  const [latest, previous] = done;
  if (!latest) return null;

  // Pain on either of the last two performances: never suggest an increase.
  if (latest.painFlag || previous?.painFlag) return null;

  if (latest.sessionRpe != null && latest.sessionRpe >= VERY_HARD_SESSION_RPE) {
    return hold("session_very_hard", { rpe: latest.sessionRpe });
  }

  if (previous) {
    const gapDays = (Date.parse(latest.performedAt) - Date.parse(previous.performedAt)) / DAY_MS;
    if (gapDays > LONG_BREAK_DAYS) return hold("after_break", { days: Math.floor(gapDays) });
  }

  const latestRpe = maxRpe(latest);

  if (previous && target.targetRepsMax != null) {
    const bothHit = hitTopOfRange(latest, target) && hitTopOfRange(previous, target);
    const prevRpe = maxRpe(previous);
    const rpes = [latestRpe, prevRpe].filter((r): r is number => r != null);
    const rpeOk = rpes.every((r) => r <= LOW_RPE);
    if (bothHit && rpeOk) {
      const reasonCode: ReasonCode = rpes.length
        ? "double_progression"
        : "double_progression_no_rpe";
      const reasonPayload = { reps: target.targetRepsMax, rpe: LOW_RPE };
      const increase = increaseFor(target, latest);
      if (increase) return { ...increase, reasonCode, reasonPayload, isIncrease: true };
    }
  }

  if (latestRpe != null && latestRpe >= 8 && latestRpe <= 9) {
    return hold("rpe_high", { rpe: latestRpe });
  }

  if (target.targetRepsMin != null) {
    const below = workingSets(latest).some((s) => (s.reps ?? 0) < target.targetRepsMin!);
    if (below) {
      return {
        type: "reduce",
        reasonCode: "below_range",
        reasonPayload: { min: target.targetRepsMin },
        suggestedPayload: {},
        isIncrease: false,
      };
    }
  }

  return null;
}

function hold(reasonCode: ReasonCode, reasonPayload: Suggestion["reasonPayload"]): Suggestion {
  return {
    type: reasonCode === "after_break" ? "return_easy" : "hold",
    reasonCode,
    reasonPayload,
    suggestedPayload: {},
    isIncrease: false,
  };
}

function increaseFor(
  target: PlanTarget,
  latest: PerformanceInput,
): Pick<Suggestion, "type" | "suggestedPayload"> | null {
  switch (target.trackingMode) {
    case "reps_weight": {
      const used = workingSets(latest)
        .map((s) => s.weightKg)
        .filter((w): w is number => w != null);
      const from = target.targetWeightKg ?? (used.length ? Math.max(...used) : null);
      if (from == null) return null;
      const step = target.progressionStepKg ?? DEFAULT_STEP_KG;
      return {
        type: "increase_weight",
        suggestedPayload: { from, to: round(from + step), step },
      };
    }
    case "reps_band":
      return { type: "harder_band", suggestedPayload: { from: target.targetBandLabel } };
    case "reps_trx":
      return { type: "harder_trx", suggestedPayload: { from: target.targetTrxPosition } };
    case "reps":
    case "reps_duration": {
      const max = target.targetRepsMax!;
      if (max >= MAX_REPS_TARGET) {
        return { type: "harder_variation", suggestedPayload: {} };
      }
      const add = max + 2 <= MAX_REPS_TARGET ? 2 : 1;
      const min = target.targetRepsMin ?? max;
      return {
        type: "increase_reps",
        suggestedPayload: { fromMin: min, fromMax: max, min: min + add, max: max + add },
      };
    }
    case "duration":
      return null;
  }
}

/** Days since the last completed workout; used for the "ease back in" hint. */
export function isLongBreak(lastCompletedAt: string | null, now: Date = new Date()): boolean {
  if (!lastCompletedAt) return false;
  return (now.getTime() - Date.parse(lastCompletedAt)) / DAY_MS > LONG_BREAK_DAYS;
}
