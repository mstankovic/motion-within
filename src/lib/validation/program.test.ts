import { describe, expect, it } from "vitest";
import { targetsSchema } from "./program";

const base = {
  targetSets: 3,
  targetRepsMin: 8,
  targetRepsMax: 12,
  targetDurationSeconds: null,
  targetWeightKg: null,
  targetBandLabel: "  ",
  targetTrxPosition: null,
  tempo: "3-1-1",
  restSeconds: 60,
  progressionStepKg: null,
  notes: null,
};

describe("targetsSchema", () => {
  it("accepts a valid plan and normalizes blank text to null", () => {
    const parsed = targetsSchema.parse(base);
    expect(parsed.targetBandLabel).toBeNull();
    expect(parsed.tempo).toBe("3-1-1");
  });

  it("rejects an inverted rep range", () => {
    const result = targetsSchema.safeParse({ ...base, targetRepsMin: 12, targetRepsMax: 8 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("repsRange");
  });

  it("rejects negative values and zero sets", () => {
    expect(targetsSchema.safeParse({ ...base, restSeconds: -1 }).success).toBe(false);
    expect(targetsSchema.safeParse({ ...base, targetSets: 0 }).success).toBe(false);
    expect(targetsSchema.safeParse({ ...base, targetWeightKg: -2.5 }).success).toBe(false);
  });
});
