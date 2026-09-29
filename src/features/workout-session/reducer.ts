import type { OutboxKind } from "@/lib/offline/outbox-core";
import type { LocalExercise, LocalSession, LocalSet, Performance, SetValues } from "./types";

export type Mutation = { kind: OutboxKind; entityId: string; payload: Record<string, unknown> };

export type Action =
  | { type: "updateSet"; exerciseId: string; setId: string; patch: Partial<SetValues> }
  | { type: "toggleSetDone"; exerciseId: string; setId: string }
  | { type: "addSet"; exerciseId: string; newId: string }
  | { type: "removeLastSet"; exerciseId: string }
  | { type: "copyPrevious"; exerciseId: string; previous: Performance["sets"] }
  | { type: "applyToAll"; exerciseId: string; fromSetId: string }
  | { type: "setExerciseStatus"; exerciseId: string; status: LocalExercise["status"] }
  | {
      type: "updateExercise";
      exerciseId: string;
      patch: Partial<Pick<LocalExercise, "notes" | "pain_flag" | "pain_note">>;
    }
  | {
      type: "updateSession";
      patch: Partial<
        Pick<LocalSession["session"], "session_rpe" | "energy_after" | "recovery_rating" | "notes">
      >;
    }
  | { type: "complete"; completedAt: string };

const VALUE_KEYS: (keyof SetValues)[] = [
  "reps",
  "duration_seconds",
  "weight_kg",
  "band_label",
  "trx_position",
  "rpe",
  "completed",
  "notes",
];

/** Full row for an idempotent upsert of a set. */
export function setRow(set: LocalSet): Record<string, unknown> {
  return {
    id: set.id,
    session_exercise_id: set.session_exercise_id,
    set_number: set.set_number,
    is_warmup: set.is_warmup,
    ...Object.fromEntries(VALUE_KEYS.map((k) => [k, set[k]])),
  };
}

function withExercise(
  state: LocalSession,
  exerciseId: string,
  fn: (ex: LocalExercise) => { ex: LocalExercise; mutations: Mutation[] },
): { state: LocalSession; mutations: Mutation[] } {
  let mutations: Mutation[] = [];
  const exercises = state.exercises.map((ex) => {
    if (ex.id !== exerciseId) return ex;
    const result = fn(ex);
    mutations = result.mutations;
    return result.ex;
  });
  return { state: { ...state, exercises }, mutations };
}

/** Keeps the exercise status consistent with its sets (unless explicitly skipped). */
function syncStatus(
  ex: LocalExercise,
  mutations: Mutation[],
): { ex: LocalExercise; mutations: Mutation[] } {
  if (ex.status === "skipped") return { ex, mutations };
  const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.completed);
  const status = allDone ? "completed" : "pending";
  if (status === ex.status) return { ex, mutations };
  return {
    ex: { ...ex, status },
    mutations: [...mutations, { kind: "exercise.update", entityId: ex.id, payload: { status } }],
  };
}

const upsert = (set: LocalSet): Mutation => ({
  kind: "set.upsert",
  entityId: set.id,
  payload: setRow(set),
});

export function reduce(
  state: LocalSession,
  action: Action,
): { state: LocalSession; mutations: Mutation[] } {
  switch (action.type) {
    case "updateSet":
    case "toggleSetDone":
      return withExercise(state, action.exerciseId, (ex) => {
        let changed: LocalSet | null = null;
        const sets = ex.sets.map((s) => {
          if (s.id !== action.setId) return s;
          changed =
            action.type === "toggleSetDone"
              ? { ...s, completed: !s.completed }
              : { ...s, ...action.patch };
          return changed;
        });
        if (!changed) return { ex, mutations: [] };
        return syncStatus({ ...ex, sets }, [upsert(changed)]);
      });

    case "addSet":
      return withExercise(state, action.exerciseId, (ex) => {
        const last = ex.sets.at(-1);
        const set: LocalSet = {
          id: action.newId,
          session_exercise_id: ex.id,
          set_number: (last?.set_number ?? 0) + 1,
          is_warmup: false,
          reps: null,
          duration_seconds: null,
          weight_kg: last?.weight_kg ?? ex.target_weight_kg_snapshot,
          band_label: last?.band_label ?? ex.target_band_label_snapshot,
          trx_position: last?.trx_position ?? ex.target_trx_position_snapshot,
          rpe: null,
          completed: false,
          notes: null,
        };
        return syncStatus({ ...ex, sets: [...ex.sets, set] }, [upsert(set)]);
      });

    case "removeLastSet":
      return withExercise(state, action.exerciseId, (ex) => {
        const last = ex.sets.at(-1);
        // Only an unfinished set can be removed, and at least one set remains.
        if (!last || last.completed || ex.sets.length <= 1) return { ex, mutations: [] };
        return syncStatus({ ...ex, sets: ex.sets.slice(0, -1) }, [
          { kind: "set.delete", entityId: last.id, payload: { id: last.id } },
        ]);
      });

    case "copyPrevious":
      return withExercise(state, action.exerciseId, (ex) => {
        const previous = action.previous.filter((s) => !s.is_warmup);
        if (!previous.length) return { ex, mutations: [] };
        const mutations: Mutation[] = [];
        const sets = ex.sets.map((s, i) => {
          const p = previous[Math.min(i, previous.length - 1)];
          if (s.completed || !p) return s;
          const next: LocalSet = {
            ...s,
            reps: p.reps,
            duration_seconds: p.duration_seconds,
            weight_kg: p.weight_kg == null ? null : Number(p.weight_kg),
            band_label: p.band_label,
            trx_position: p.trx_position,
          };
          mutations.push(upsert(next));
          return next;
        });
        return { ex: { ...ex, sets }, mutations };
      });

    case "applyToAll":
      return withExercise(state, action.exerciseId, (ex) => {
        const source = ex.sets.find((s) => s.id === action.fromSetId);
        if (!source) return { ex, mutations: [] };
        const mutations: Mutation[] = [];
        const sets = ex.sets.map((s) => {
          if (s.id === source.id || s.completed) return s;
          const next: LocalSet = {
            ...s,
            reps: source.reps,
            duration_seconds: source.duration_seconds,
            weight_kg: source.weight_kg,
            band_label: source.band_label,
            trx_position: source.trx_position,
          };
          mutations.push(upsert(next));
          return next;
        });
        return { ex: { ...ex, sets }, mutations };
      });

    case "setExerciseStatus":
      return withExercise(state, action.exerciseId, (ex) => {
        if (action.status === "pending") {
          return syncStatus({ ...ex, status: "pending" }, [
            { kind: "exercise.update", entityId: ex.id, payload: { status: "pending" } },
          ]);
        }
        return {
          ex: { ...ex, status: action.status },
          mutations: [
            { kind: "exercise.update", entityId: ex.id, payload: { status: action.status } },
          ],
        };
      });

    case "updateExercise":
      return withExercise(state, action.exerciseId, (ex) => ({
        ex: { ...ex, ...action.patch },
        mutations: [{ kind: "exercise.update", entityId: ex.id, payload: action.patch }],
      }));

    case "updateSession":
      return {
        state: { ...state, session: { ...state.session, ...action.patch } },
        mutations: [{ kind: "session.update", entityId: state.session.id, payload: action.patch }],
      };

    case "complete": {
      const s = state.session;
      const payload = {
        status: "completed",
        completed_at: action.completedAt,
        session_rpe: s.session_rpe,
        energy_after: s.energy_after,
        recovery_rating: s.recovery_rating,
        notes: s.notes,
      };
      return {
        state: {
          ...state,
          session: { ...s, status: "completed", completed_at: action.completedAt },
        },
        mutations: [{ kind: "session.complete", entityId: s.id, payload }],
      };
    }
  }
}

export function progress(state: LocalSession) {
  const total = state.exercises.length;
  const done = state.exercises.filter((e) => e.status !== "pending").length;
  return { done, total };
}
