import { describe, expect, it } from "vitest";
import { formatRepsTarget, isRepsRangeValid, plannedSetCount } from "./plan";

describe("session snapshot planning", () => {
  it("creates one set per round for circuits and target sets otherwise", () => {
    expect(plannedSetCount("circuit", 3, 1)).toBe(3);
    expect(plannedSetCount("superset", 1, 4)).toBe(4);
    expect(plannedSetCount("single", 2, 3)).toBe(3);
    expect(plannedSetCount("single", 1, 0)).toBe(1);
  });

  it("validates rep ranges", () => {
    expect(isRepsRangeValid({ min: 8, max: 12 })).toBe(true);
    expect(isRepsRangeValid({ min: 12, max: 8 })).toBe(false);
    expect(isRepsRangeValid({ min: -1, max: null })).toBe(false);
    expect(isRepsRangeValid({ min: null, max: null })).toBe(true);
  });

  it("formats rep targets", () => {
    expect(formatRepsTarget({ min: 8, max: 12 })).toBe("8–12");
    expect(formatRepsTarget({ min: 10, max: 10 })).toBe("10");
    expect(formatRepsTarget({ min: 10, max: null })).toBe("10+");
    expect(formatRepsTarget({ min: null, max: null })).toBeNull();
  });
});
