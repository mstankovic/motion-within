import { formatNumber } from "@/lib/dates";
import type { TrackingMode } from "./types";

type SetLike = {
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | string | null;
  band_label: string | null;
  trx_position: string | null;
};

/** Compact, unit-explicit rendering of one set, e.g. "12 × 10 kg", "12 · green", "45 s". */
export function formatSetValue(set: SetLike, mode: TrackingMode, locale: string): string {
  const reps = set.reps != null ? String(set.reps) : "–";
  switch (mode) {
    case "reps":
      return reps;
    case "reps_weight":
      return set.weight_kg != null
        ? `${reps} × ${formatNumber(Number(set.weight_kg), locale, 2)} kg`
        : reps;
    case "reps_band":
      return set.band_label ? `${reps} · ${set.band_label}` : reps;
    case "reps_trx":
      return set.trx_position ? `${reps} · ${set.trx_position}` : reps;
    case "duration":
      return set.duration_seconds != null ? `${set.duration_seconds} s` : "–";
    case "reps_duration":
      return set.duration_seconds != null ? `${reps} · ${set.duration_seconds} s` : reps;
  }
}

export function formatSetsSummary(
  sets: (SetLike & { completed: boolean; is_warmup?: boolean })[],
  mode: TrackingMode,
  locale: string,
): string {
  const done = sets.filter((s) => s.completed && !s.is_warmup);
  if (!done.length) return "–";
  return done.map((s) => formatSetValue(s, mode, locale)).join(", ");
}
