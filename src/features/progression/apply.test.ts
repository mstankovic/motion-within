import { describe, expect, it } from "vitest";
import { acceptPatch, isStale } from "./apply";

const plan = {
  target_weight_kg: 10,
  target_reps_min: 8,
  target_reps_max: 12,
  target_band_label: "zelena",
  target_trx_position: null,
};

describe("suggestion application", () => {
  it("applies the suggested weight or the user's edit", () => {
    expect(acceptPatch("increase_weight", { from: 10, to: 12.5 })).toEqual({
      target_weight_kg: 12.5,
    });
    expect(acceptPatch("increase_weight", { from: 10, to: 12.5 }, 11)).toEqual({
      target_weight_kg: 11,
    });
  });

  it("requires the user to name the stronger band or harder TRX position", () => {
    expect(acceptPatch("harder_band", { from: "zelena" })).toBe("needs_value");
    expect(acceptPatch("harder_band", { from: "zelena" }, " plava ")).toEqual({
      target_band_label: "plava",
    });
    expect(acceptPatch("harder_trx", {}, "teška")).toEqual({ target_trx_position: "teška" });
  });

  it("raises the rep range", () => {
    expect(acceptPatch("increase_reps", { min: 10, max: 14 })).toEqual({
      target_reps_min: 10,
      target_reps_max: 14,
    });
  });

  it("does not change the plan for hold-type suggestions", () => {
    expect(acceptPatch("hold", {})).toBeNull();
  });

  it("detects a changed program", () => {
    expect(isStale({ ...plan }, plan)).toBe(false);
    expect(isStale({ ...plan }, { ...plan, target_weight_kg: 15 })).toBe(true);
    expect(isStale({ ...plan, target_weight_kg: "10.00" as unknown as number }, plan)).toBe(false);
    expect(isStale({ ...plan }, null)).toBe(true);
  });
});
