import { describe, expect, it } from "vitest";
import { progress, reduce } from "./reducer";
import type { LocalExercise, LocalSession, LocalSet } from "./types";

function makeSet(id: string, n: number, over: Partial<LocalSet> = {}): LocalSet {
  return {
    id,
    session_exercise_id: "e1",
    set_number: n,
    is_warmup: false,
    reps: null,
    duration_seconds: null,
    weight_kg: null,
    band_label: null,
    trx_position: null,
    rpe: null,
    completed: false,
    notes: null,
    ...over,
  };
}

function makeState(): LocalSession {
  const ex = {
    id: "e1",
    status: "pending",
    sets: [makeSet("s1", 1), makeSet("s2", 2)],
    target_weight_kg_snapshot: 10,
    target_band_label_snapshot: null,
    target_trx_position_snapshot: null,
    notes: null,
    pain_flag: false,
    pain_note: null,
  } as unknown as LocalExercise;
  return {
    session: {
      id: "sess",
      status: "in_progress",
      session_rpe: null,
      energy_after: null,
      recovery_rating: null,
      notes: null,
    } as LocalSession["session"],
    exercises: [ex],
  };
}

describe("workout reducer", () => {
  it("updates a set and emits a full-row upsert", () => {
    const { state, mutations } = reduce(makeState(), {
      type: "updateSet",
      exerciseId: "e1",
      setId: "s1",
      patch: { reps: 12 },
    });
    expect(state.exercises[0].sets[0].reps).toBe(12);
    expect(mutations).toEqual([
      expect.objectContaining({
        kind: "set.upsert",
        entityId: "s1",
        payload: expect.objectContaining({ id: "s1", set_number: 1, reps: 12 }),
      }),
    ]);
  });

  it("completes the exercise when all sets are done and reopens it when one is undone", () => {
    let s = reduce(makeState(), { type: "toggleSetDone", exerciseId: "e1", setId: "s1" }).state;
    const r = reduce(s, { type: "toggleSetDone", exerciseId: "e1", setId: "s2" });
    s = r.state;
    expect(s.exercises[0].status).toBe("completed");
    expect(r.mutations.at(-1)).toMatchObject({
      kind: "exercise.update",
      payload: { status: "completed" },
    });
    expect(progress(s)).toEqual({ done: 1, total: 1 });
    s = reduce(s, { type: "toggleSetDone", exerciseId: "e1", setId: "s2" }).state;
    expect(s.exercises[0].status).toBe("pending");
  });

  it("adds a set carrying over the load and removes only an unfinished last set", () => {
    let s = reduce(makeState(), {
      type: "updateSet",
      exerciseId: "e1",
      setId: "s2",
      patch: { weight_kg: 12 },
    }).state;
    const added = reduce(s, { type: "addSet", exerciseId: "e1", newId: "s3" });
    s = added.state;
    expect(s.exercises[0].sets.at(-1)).toMatchObject({ id: "s3", set_number: 3, weight_kg: 12 });
    const removed = reduce(s, { type: "removeLastSet", exerciseId: "e1" });
    expect(removed.state.exercises[0].sets).toHaveLength(2);
    expect(removed.mutations[0]).toMatchObject({ kind: "set.delete", entityId: "s3" });

    s = reduce(removed.state, { type: "toggleSetDone", exerciseId: "e1", setId: "s2" }).state;
    expect(reduce(s, { type: "removeLastSet", exerciseId: "e1" }).mutations).toEqual([]);
  });

  it("copies last time's values into unfinished sets", () => {
    const { state, mutations } = reduce(makeState(), {
      type: "copyPrevious",
      exerciseId: "e1",
      previous: [
        {
          set_number: 1,
          reps: 10,
          duration_seconds: null,
          weight_kg: 12.5,
          band_label: null,
          trx_position: null,
          rpe: 7,
          completed: true,
          is_warmup: false,
        },
      ],
    });
    expect(state.exercises[0].sets.map((s) => [s.reps, s.weight_kg])).toEqual([
      [10, 12.5],
      [10, 12.5],
    ]);
    expect(mutations).toHaveLength(2);
  });

  it("applies one set's values to the other unfinished sets", () => {
    let s = reduce(makeState(), {
      type: "updateSet",
      exerciseId: "e1",
      setId: "s1",
      patch: { reps: 8, band_label: "zelena" },
    }).state;
    s = reduce(s, { type: "applyToAll", exerciseId: "e1", fromSetId: "s1" }).state;
    expect(s.exercises[0].sets[1]).toMatchObject({
      reps: 8,
      band_label: "zelena",
      completed: false,
    });
  });

  it("skipping is kept even if sets change", () => {
    let s = reduce(makeState(), {
      type: "setExerciseStatus",
      exerciseId: "e1",
      status: "skipped",
    }).state;
    s = reduce(s, { type: "toggleSetDone", exerciseId: "e1", setId: "s1" }).state;
    expect(s.exercises[0].status).toBe("skipped");
  });

  it("completion carries the session summary", () => {
    let s = reduce(makeState(), {
      type: "updateSession",
      patch: { session_rpe: 7, energy_after: 4 },
    }).state;
    const r = reduce(s, { type: "complete", completedAt: "2026-09-28T18:00:00Z" });
    s = r.state;
    expect(s.session.status).toBe("completed");
    expect(r.mutations[0]).toMatchObject({
      kind: "session.complete",
      payload: {
        status: "completed",
        session_rpe: 7,
        energy_after: 4,
        completed_at: "2026-09-28T18:00:00Z",
      },
    });
  });
});
