import type { BlockType } from "./types";

/**
 * Number of sets a session creates for a planned exercise.
 * Circuits repeat every exercise once per round; single and superset blocks use target sets.
 * Mirrors public.start_session() in the database.
 */
export function plannedSetCount(blockType: BlockType, rounds: number, targetSets: number): number {
  const n = blockType === "circuit" ? rounds : targetSets;
  return Math.max(1, Math.floor(n));
}

export type RepsTarget = { min: number | null; max: number | null };

export function formatRepsTarget({ min, max }: RepsTarget): string | null {
  if (min != null && max != null) return min === max ? `${min}` : `${min}–${max}`;
  if (max != null) return `${max}`;
  if (min != null) return `${min}+`;
  return null;
}

export function isRepsRangeValid({ min, max }: RepsTarget): boolean {
  if (min != null && min < 0) return false;
  if (max != null && max < 0) return false;
  return min == null || max == null || min <= max;
}
