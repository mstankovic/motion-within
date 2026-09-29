import { describe, expect, it } from "vitest";
import { evaluateProgression, isLongBreak, type PerformanceInput, type PlanTarget } from "./engine";

const base: PlanTarget = {
  trackingMode: "reps_weight",
  isMobility: false,
  targetSets: 3,
  targetRepsMin: 8,
  targetRepsMax: 12,
  targetWeightKg: 10,
  targetBandLabel: null,
  targetTrxPosition: null,
  progressionStepKg: null,
};

function perf(
  date: string,
  reps: number[],
  opts: Partial<Omit<PerformanceInput, "sets">> & { rpe?: number | null; weight?: number } = {},
): PerformanceInput {
  return {
    performedAt: `${date}T10:00:00Z`,
    status: opts.status ?? "completed",
    painFlag: opts.painFlag ?? false,
    sessionRpe: opts.sessionRpe ?? null,
    sets: reps.map((r) => ({
      reps: r,
      weightKg: opts.weight ?? 10,
      rpe: opts.rpe === undefined ? 7 : opts.rpe,
      completed: true,
      isWarmup: false,
    })),
  };
}

describe("evaluateProgression — double progression", () => {
  it("suggests +2.5 kg after two sessions at the top of the range with RPE ≤ 7", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 12]),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s).toMatchObject({
      type: "increase_weight",
      reasonCode: "double_progression",
      suggestedPayload: { from: 10, to: 12.5 },
      isIncrease: true,
    });
  });

  it("uses the custom progression step", () => {
    const s = evaluateProgression({ ...base, progressionStepKg: 1 }, [
      perf("2026-09-25", [12, 12, 12]),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s?.suggestedPayload).toMatchObject({ to: 11 });
  });

  it("needs two completed performances", () => {
    expect(evaluateProgression(base, [perf("2026-09-25", [12, 12, 12])])).toBeNull();
  });

  it("requires every planned working set to reach the top of the range", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 11]),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s?.isIncrease ?? false).toBe(false);
  });

  it("requires at least the planned number of sets", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12]),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s?.isIncrease ?? false).toBe(false);
  });

  it("does not increase when RPE was above 7 and suggests holding at RPE 8–9", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 12], { rpe: 8 }),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s).toMatchObject({ type: "hold", reasonCode: "rpe_high", isIncrease: false });
  });

  it("allows progression when no RPE was recorded, with a matching explanation", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 12], { rpe: null }),
      perf("2026-09-22", [12, 12, 12], { rpe: null }),
    ]);
    expect(s?.reasonCode).toBe("double_progression_no_rpe");
  });
});

describe("evaluateProgression — safety rules", () => {
  it("never suggests an increase with a pain flag on the latest performance", () => {
    expect(
      evaluateProgression(base, [
        perf("2026-09-25", [12, 12, 12], { painFlag: true }),
        perf("2026-09-22", [12, 12, 12]),
      ]),
    ).toBeNull();
  });

  it("never suggests an increase with a pain flag on the previous performance", () => {
    expect(
      evaluateProgression(base, [
        perf("2026-09-25", [12, 12, 12]),
        perf("2026-09-22", [12, 12, 12], { painFlag: true }),
      ]),
    ).toBeNull();
  });

  it("holds after a very hard session", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 12], { sessionRpe: 9 }),
      perf("2026-09-22", [12, 12, 12]),
    ]);
    expect(s).toMatchObject({ reasonCode: "session_very_hard", isIncrease: false });
  });

  it("does not increase after a break longer than 14 days", () => {
    const s = evaluateProgression(base, [
      perf("2026-09-25", [12, 12, 12]),
      perf("2026-09-01", [12, 12, 12]),
    ]);
    expect(s).toMatchObject({ type: "return_easy", reasonCode: "after_break", isIncrease: false });
  });

  it("returns a neutral message when reps fall below the range", () => {
    const s = evaluateProgression(base, [perf("2026-09-25", [8, 7, 6], { rpe: 7 })]);
    expect(s).toMatchObject({
      type: "reduce",
      reasonCode: "below_range",
      reasonPayload: { min: 8 },
    });
  });

  it("ignores mobility exercises", () => {
    expect(
      evaluateProgression({ ...base, isMobility: true }, [
        perf("2026-09-25", [12, 12, 12]),
        perf("2026-09-22", [12, 12, 12]),
      ]),
    ).toBeNull();
  });

  it("ignores duration exercises unless opted in", () => {
    expect(
      evaluateProgression({ ...base, trackingMode: "duration" }, [
        perf("2026-09-25", [12, 12, 12]),
        perf("2026-09-22", [12, 12, 12]),
      ]),
    ).toBeNull();
  });
});

describe("evaluateProgression — per tracking mode", () => {
  const history = [perf("2026-09-25", [12, 12, 12]), perf("2026-09-22", [12, 12, 12])];

  it("suggests a stronger band without choosing a colour", () => {
    const s = evaluateProgression(
      { ...base, trackingMode: "reps_band", targetBandLabel: "zelena" },
      history,
    );
    expect(s).toMatchObject({ type: "harder_band", suggestedPayload: { from: "zelena" } });
  });

  it("suggests a harder TRX position", () => {
    const s = evaluateProgression(
      { ...base, trackingMode: "reps_trx", targetTrxPosition: "srednja" },
      history,
    );
    expect(s?.type).toBe("harder_trx");
  });

  it("raises the reps target by 2 for bodyweight exercises", () => {
    const s = evaluateProgression({ ...base, trackingMode: "reps" }, history);
    expect(s).toMatchObject({ type: "increase_reps", suggestedPayload: { min: 10, max: 14 } });
  });

  it("suggests a harder variation once the reps cap is reached", () => {
    const s = evaluateProgression(
      { ...base, trackingMode: "reps", targetRepsMin: 15, targetRepsMax: 20 },
      [perf("2026-09-25", [20, 20, 20]), perf("2026-09-22", [20, 20, 20])],
    );
    expect(s?.type).toBe("harder_variation");
  });
});

describe("isLongBreak", () => {
  it("is true after more than 14 days", () => {
    expect(isLongBreak("2026-09-01T10:00:00Z", new Date("2026-09-16T10:00:01Z"))).toBe(true);
    expect(isLongBreak("2026-09-10T10:00:00Z", new Date("2026-09-16T10:00:00Z"))).toBe(false);
    expect(isLongBreak(null)).toBe(false);
  });
});
