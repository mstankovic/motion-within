import { describe, expect, it } from "vitest";
import { exerciseName, filterExercises, normalizeSearch, type ExerciseListItem } from "./model";

const ex = (over: Partial<ExerciseListItem>): ExerciseListItem => ({
  id: "1",
  owner_id: null,
  source: "system",
  slug: "s",
  name_sr: "Čučanj",
  name_en: "Squat",
  custom_name: null,
  tracking_mode: "reps",
  is_mobility: false,
  is_active: true,
  muscles: [{ id: "quads", role: "primary" }],
  equipment: ["bw"],
  ...over,
});

describe("exercise model", () => {
  it("localizes system names and keeps user names as typed", () => {
    expect(exerciseName(ex({}), "sr")).toBe("Čučanj");
    expect(exerciseName(ex({}), "en")).toBe("Squat");
    expect(
      exerciseName(ex({ custom_name: "Moj čučanj", name_sr: null, name_en: null }), "en"),
    ).toBe("Moj čučanj");
  });

  it("searches without diacritics", () => {
    expect(normalizeSearch("Čučanj Đak")).toBe("cucanj djak");
    expect(filterExercises([ex({})], { q: "cucanj" }, "sr")).toHaveLength(1);
    expect(filterExercises([ex({})], { q: "squ" }, "sr")).toHaveLength(1);
  });

  it("filters by muscle, equipment, tracking mode and source", () => {
    const list = [
      ex({ id: "a" }),
      ex({
        id: "b",
        source: "user",
        owner_id: "u",
        tracking_mode: "reps_band",
        equipment: ["band"],
        muscles: [],
      }),
    ];
    expect(filterExercises(list, { muscle: "quads" }, "sr").map((e) => e.id)).toEqual(["a"]);
    expect(filterExercises(list, { equipment: "band" }, "sr").map((e) => e.id)).toEqual(["b"]);
    expect(filterExercises(list, { tracking: "reps_band" }, "sr").map((e) => e.id)).toEqual(["b"]);
    expect(filterExercises(list, { scope: "mine" }, "sr").map((e) => e.id)).toEqual(["b"]);
  });

  it("hides archived exercises", () => {
    expect(filterExercises([ex({ is_active: false })], {}, "sr")).toHaveLength(0);
  });
});
