import type { HistorySet, TrackingMode } from "@/features/workout-session/types";

export type PersonalRecord =
  | { kind: "weight"; weightKg: number; reps: number; performedAt: string; sessionId: string }
  | { kind: "reps"; reps: number; performedAt: string; sessionId: string }
  | { kind: "duration"; seconds: number; performedAt: string; sessionId: string }
  | { kind: "band"; band: string; reps: number; performedAt: string; sessionId: string }
  | { kind: "trx"; position: string; reps: number; performedAt: string; sessionId: string };

/** Only completed working sets count towards records. */
function workingSets(sets: HistorySet[]) {
  return sets.filter((s) => s.completed && !s.is_warmup);
}

function normLabel(label: string | null) {
  return (label ?? "").trim();
}

/**
 * Personal records per tracking mode.
 * - reps_weight: heaviest weight with ≥1 rep (ties broken by reps).
 * - reps / reps_duration: most reps in one set.
 * - duration: longest completed duration.
 * - reps_band / reps_trx: best reps per band label / TRX position. Labels are
 *   user-defined, so no label is assumed to be "stronger" than another.
 * Earliest achievement wins ties, so a record only moves when it is beaten.
 */
export function computeRecords(mode: TrackingMode, sets: HistorySet[]): PersonalRecord[] {
  const done = workingSets(sets).sort((a, b) => a.performed_at.localeCompare(b.performed_at));

  switch (mode) {
    case "reps_weight": {
      let best: PersonalRecord | null = null;
      for (const s of done) {
        if (s.weight_kg == null || !s.reps || s.reps < 1) continue;
        const w = Number(s.weight_kg);
        if (
          !best ||
          best.kind !== "weight" ||
          w > best.weightKg ||
          (w === best.weightKg && s.reps > best.reps)
        ) {
          best = {
            kind: "weight",
            weightKg: w,
            reps: s.reps,
            performedAt: s.performed_at,
            sessionId: s.session_id,
          };
        }
      }
      return best ? [best] : [];
    }
    case "reps":
    case "reps_duration": {
      let best: PersonalRecord | null = null;
      for (const s of done) {
        if (!s.reps) continue;
        if (!best || (best.kind === "reps" && s.reps > best.reps)) {
          best = {
            kind: "reps",
            reps: s.reps,
            performedAt: s.performed_at,
            sessionId: s.session_id,
          };
        }
      }
      return best ? [best] : [];
    }
    case "duration": {
      let best: PersonalRecord | null = null;
      for (const s of done) {
        if (!s.duration_seconds) continue;
        if (!best || (best.kind === "duration" && s.duration_seconds > best.seconds)) {
          best = {
            kind: "duration",
            seconds: s.duration_seconds,
            performedAt: s.performed_at,
            sessionId: s.session_id,
          };
        }
      }
      return best ? [best] : [];
    }
    case "reps_band":
    case "reps_trx": {
      const byLabel = new Map<string, PersonalRecord>();
      for (const s of done) {
        if (!s.reps) continue;
        const label = normLabel(mode === "reps_band" ? s.band_label : s.trx_position);
        if (!label) continue;
        const key = label.toLocaleLowerCase();
        const current = byLabel.get(key);
        if (!current || ("reps" in current && s.reps > current.reps)) {
          byLabel.set(
            key,
            mode === "reps_band"
              ? {
                  kind: "band",
                  band: label,
                  reps: s.reps,
                  performedAt: s.performed_at,
                  sessionId: s.session_id,
                }
              : {
                  kind: "trx",
                  position: label,
                  reps: s.reps,
                  performedAt: s.performed_at,
                  sessionId: s.session_id,
                },
          );
        }
      }
      return [...byLabel.values()].sort((a, b) => b.performedAt.localeCompare(a.performedAt));
    }
  }
}

/** Records first achieved in the given session (i.e. new PRs from that workout). */
export function newRecordsInSession(
  mode: TrackingMode,
  sets: HistorySet[],
  sessionId: string,
): PersonalRecord[] {
  const target = sets.find((s) => s.session_id === sessionId);
  if (!target) return [];
  const before = sets.filter(
    (s) => s.performed_at < target.performed_at && s.session_id !== sessionId,
  );
  const upTo = sets.filter((s) => s.performed_at <= target.performed_at);
  const previous = computeRecords(mode, before);
  // First-ever performance is a baseline, not a "new record".
  if (previous.length === 0) return [];
  return computeRecords(mode, upTo).filter((r) => r.sessionId === sessionId);
}

/** Metric plotted on the exercise chart for a tracking mode (one point per session). */
export function chartSeries(
  mode: TrackingMode,
  sets: HistorySet[],
): { date: string; value: number; label?: string }[] {
  const bySession = new Map<string, HistorySet[]>();
  for (const s of workingSets(sets)) {
    const list = bySession.get(s.session_id) ?? [];
    list.push(s);
    bySession.set(s.session_id, list);
  }
  const points: { date: string; value: number; label?: string }[] = [];
  for (const list of bySession.values()) {
    const date = list[0].performed_at;
    if (mode === "reps_weight") {
      const w = Math.max(...list.map((s) => (s.reps ? Number(s.weight_kg ?? 0) : 0)));
      if (w > 0) points.push({ date, value: w });
    } else if (mode === "duration") {
      const d = Math.max(...list.map((s) => s.duration_seconds ?? 0));
      if (d > 0) points.push({ date, value: d });
    } else {
      const best = list.reduce<HistorySet | null>(
        (acc, s) => ((s.reps ?? 0) > (acc?.reps ?? 0) ? s : acc),
        null,
      );
      if (best?.reps) {
        const label =
          mode === "reps_band"
            ? normLabel(best.band_label)
            : mode === "reps_trx"
              ? normLabel(best.trx_position)
              : undefined;
        points.push({ date, value: best.reps, label: label || undefined });
      }
    }
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export function chartMetric(mode: TrackingMode): "maxWeight" | "maxDuration" | "maxReps" {
  if (mode === "reps_weight") return "maxWeight";
  if (mode === "duration") return "maxDuration";
  return "maxReps";
}

type CompareSet = {
  reps: number | null;
  duration_seconds: number | null;
  weight_kg: number | string | null;
  band_label: string | null;
  trx_position: string | null;
  completed: boolean;
  is_warmup: boolean;
};

/** Best value of the relevant metric plus its context label (band / TRX position). */
function topSet(
  mode: TrackingMode,
  sets: CompareSet[],
): { value: number; secondary: number; label: string } | null {
  const done = sets.filter((s) => s.completed && !s.is_warmup);
  let best: { value: number; secondary: number; label: string } | null = null;
  for (const s of done) {
    const candidate =
      mode === "reps_weight"
        ? { value: s.reps ? Number(s.weight_kg ?? 0) : 0, secondary: s.reps ?? 0, label: "" }
        : mode === "duration"
          ? { value: s.duration_seconds ?? 0, secondary: 0, label: "" }
          : {
              value: s.reps ?? 0,
              secondary: 0,
              label: normLabel(
                mode === "reps_band" ? s.band_label : mode === "reps_trx" ? s.trx_position : null,
              ).toLocaleLowerCase(),
            };
    if (
      !best ||
      candidate.value > best.value ||
      (candidate.value === best.value && candidate.secondary > best.secondary)
    ) {
      best = candidate;
    }
  }
  return best && best.value > 0 ? best : null;
}

/**
 * Compare today's top set with last time using the metric relevant to the
 * tracking mode. Band/TRX results are only compared under the same label.
 */
export function compareToLast(
  mode: TrackingMode,
  current: CompareSet[],
  previous: CompareSet[] | null | undefined,
): "better" | "same" | "worse" | null {
  if (!previous) return null;
  const a = topSet(mode, current);
  const b = topSet(mode, previous);
  if (!a || !b || a.label !== b.label) return null;
  if (a.value !== b.value) return a.value > b.value ? "better" : "worse";
  if (a.secondary !== b.secondary) return a.secondary > b.secondary ? "better" : "worse";
  return "same";
}
