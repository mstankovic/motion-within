import type { SuggestionType } from "./engine";

export type PlanSnapshot = {
  target_weight_kg: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_band_label: string | null;
  target_trx_position: string | null;
};

export type BlockExercisePatch = Partial<PlanSnapshot>;

const norm = (v: unknown) =>
  v == null || v === "" ? null : typeof v === "number" ? v : String(v).trim();

/** A suggestion is stale when the plan changed since it was generated. */
export function isStale(
  basis: Partial<PlanSnapshot> | undefined,
  current: PlanSnapshot | null,
): boolean {
  if (!current) return true;
  if (!basis) return false;
  return (Object.keys(basis) as (keyof PlanSnapshot)[]).some((k) => {
    const a = norm(basis[k]);
    const b = norm(current[k]);
    return typeof a === "number" || typeof b === "number" ? Number(a) !== Number(b) : a !== b;
  });
}

/**
 * Patch to apply to the program's block exercise when a suggestion is accepted.
 * `edited` is the user's adjusted value (weight, band, TRX position or max reps).
 * Returns null when there is nothing to change in the plan (hold/manual types).
 */
export function acceptPatch(
  type: SuggestionType,
  payload: Record<string, unknown>,
  edited?: string | number | null,
): BlockExercisePatch | null | "needs_value" {
  switch (type) {
    case "increase_weight": {
      const to = edited != null && edited !== "" ? Number(edited) : Number(payload.to);
      return Number.isFinite(to) && to >= 0 ? { target_weight_kg: to } : "needs_value";
    }
    case "increase_reps": {
      const min = Number(payload.min);
      const max = edited != null && edited !== "" ? Number(edited) : Number(payload.max);
      if (!Number.isFinite(max) || max < 1) return "needs_value";
      return { target_reps_min: Math.min(min, max), target_reps_max: max };
    }
    case "harder_band": {
      const label = typeof edited === "string" ? edited.trim() : "";
      return label ? { target_band_label: label.slice(0, 60) } : "needs_value";
    }
    case "harder_trx": {
      const position = typeof edited === "string" ? edited.trim() : "";
      return position ? { target_trx_position: position.slice(0, 60) } : "needs_value";
    }
    default:
      return null;
  }
}
