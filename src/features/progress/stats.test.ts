import { describe, expect, it } from "vitest";
import {
  adherence,
  average,
  countCompletedInRange,
  weekRange,
  weeklyContinuity,
  type SessionLite,
} from "./stats";

const s = (started_at: string, status: SessionLite["status"] = "completed"): SessionLite => ({
  started_at,
  status,
  session_rpe: null,
  energy_after: null,
});

describe("stats", () => {
  it("computes Monday-based week ranges", () => {
    expect(weekRange("2026-09-30")).toEqual({ start: "2026-09-28", end: "2026-10-04" });
    expect(weekRange("2026-09-30", -1)).toEqual({ start: "2026-09-21", end: "2026-09-27" });
  });

  it("counts completed sessions using the user's time zone", () => {
    // 23:30 UTC on Sunday is already Monday in Belgrade.
    const sessions = [
      s("2026-09-27T23:30:00Z"),
      s("2026-09-29T10:00:00Z"),
      s("2026-09-29T11:00:00Z", "abandoned"),
    ];
    expect(countCompletedInRange(sessions, weekRange("2026-09-30"), "Europe/Belgrade")).toBe(2);
    expect(countCompletedInRange(sessions, weekRange("2026-09-30"), "UTC")).toBe(1);
  });

  it("adherence ignores future workouts", () => {
    expect(
      adherence(
        [
          { planned_date: "2026-09-28", status: "completed" },
          { planned_date: "2026-09-29", status: "skipped" },
          { planned_date: "2026-10-01", status: "planned" },
        ],
        "2026-09-30",
      ),
    ).toEqual({ completed: 1, total: 2, percent: 50 });
    expect(adherence([], "2026-09-30").percent).toBeNull();
  });

  it("weekly continuity covers the last N weeks, oldest first", () => {
    const weeks = weeklyContinuity(
      [s("2026-09-29T10:00:00Z"), s("2026-09-15T10:00:00Z")],
      "2026-09-30",
      "UTC",
      4,
    );
    expect(weeks.map((w) => w.weekStart)).toEqual([
      "2026-09-07",
      "2026-09-14",
      "2026-09-21",
      "2026-09-28",
    ]);
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 0, 1]);
  });

  it("averages ignoring missing values", () => {
    expect(average([7, null, 8])).toBe(7.5);
    expect(average([null])).toBeNull();
  });
});
