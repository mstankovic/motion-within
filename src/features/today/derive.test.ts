import { describe, expect, it } from "vitest";
import type { CalendarWorkout } from "@/features/calendar/queries";
import {
  dayPart,
  deriveTodayState,
  hourInTimeZone,
  lastWeekInsight,
  stripStatus,
  summarizeWeek,
  upNext,
  upNextList,
  whenLabel,
} from "./derive";

// Tuesday 29 Sep 2026; the week runs Mon 28 Sep – Sun 4 Oct.
const TODAY = "2026-09-29";
const WEEK_START = "2026-09-28";

let seq = 0;
function w(
  planned_date: string,
  status: CalendarWorkout["status"] = "planned",
  extra: Partial<CalendarWorkout> = {},
): CalendarWorkout {
  seq += 1;
  return {
    id: `w${seq}`,
    planned_date,
    planned_time: null,
    title: `Workout ${seq}`,
    status,
    program_day_id: "day",
    intensity: "strong",
    exerciseCount: 8,
    sessionId: status === "planned" || status === "skipped" ? null : `s${seq}`,
    completedAt: null,
    ...extra,
  };
}

const PROGRAM = { id: "program" };
const derive = (
  workouts: CalendarWorkout[],
  openSession: Parameters<typeof deriveTodayState>[2] = null,
  program: Parameters<typeof deriveTodayState>[3] = PROGRAM,
) => deriveTodayState(workouts, TODAY, openSession, program);

describe("deriveTodayState", () => {
  it("1 · an open session wins over everything, even from another day", () => {
    const session = {
      id: "open",
      title_snapshot: "Full body",
      started_at: "2026-09-29T16:04:00Z",
      scheduled_workout_id: null,
    };
    expect(derive([w(TODAY), w("2026-09-28")], session)).toMatchObject({
      kind: "in_progress",
      session,
      workout: null,
    });
  });

  it("1 · links the open session to its scheduled workout", () => {
    const today = w(TODAY, "in_progress", { sessionId: "open" });
    const session = {
      id: "open",
      title_snapshot: "x",
      started_at: "",
      scheduled_workout_id: today.id,
    };
    expect(derive([today], session)).toMatchObject({ kind: "in_progress", workout: today });
  });

  it("2 · planned today comes before a missed workout; earliest time first", () => {
    const late = w(TODAY, "planned", { planned_time: "18:00:00" });
    const early = w(TODAY, "planned", { planned_time: "07:30:00" });
    expect(derive([w("2026-09-28"), late, early])).toEqual({
      kind: "planned",
      workout: early,
      plannedToday: 2,
    });
  });

  it("3 · a past planned workout this week is missed (the most recent one)", () => {
    const monday = w("2026-09-28");
    expect(derive([monday, w("2026-09-30")])).toEqual({ kind: "missed", workout: monday });
  });

  it("3 · last week's planned workouts are not missed", () => {
    expect(derive([w("2026-09-25"), w("2026-09-30")]).kind).toBe("rest");
  });

  it("3 before 4 · missed takes priority over completed today", () => {
    expect(derive([w("2026-09-28"), w(TODAY, "completed")]).kind).toBe("missed");
  });

  it("4 · completed today counts what is left this week", () => {
    const done = w(TODAY, "completed");
    expect(
      derive([done, w("2026-09-30"), w("2026-10-02"), w("2026-10-03", "skipped"), w("2026-10-06")]),
    ).toEqual({ kind: "completed", workout: done, leftThisWeek: 2 });
  });

  it("5 · rest day carries the next planned workout, even next week", () => {
    const next = w("2026-10-05");
    expect(derive([w("2026-10-07"), next])).toEqual({ kind: "rest", next });
  });

  it("skipped past workouts are not missed", () => {
    expect(derive([w("2026-09-28", "skipped")])).toEqual({ kind: "rest", next: null });
  });

  it("6 · an active program with an empty week is unplanned", () => {
    expect(derive([])).toEqual({ kind: "unplanned" });
  });

  it("7 · no program and nothing scheduled is the first-run state", () => {
    expect(derive([], null, null)).toEqual({ kind: "no_program" });
  });

  it("scheduled workouts still show without an active program", () => {
    const next = w("2026-10-01");
    expect(derive([next], null, null)).toEqual({ kind: "rest", next });
  });
});

describe("summarizeWeek", () => {
  it("counts non-skipped workouts and keeps segments in date order", () => {
    const summary = summarizeWeek(
      [
        w("2026-10-02"),
        w("2026-09-28", "completed"),
        w(TODAY, "in_progress"),
        w("2026-09-30", "skipped"),
      ],
      WEEK_START,
      TODAY,
    );
    expect(summary.done).toBe(1);
    expect(summary.total).toBe(3);
    expect(summary.segments).toEqual(["completed", "in_progress", "planned"]);
    expect(summary.days.map((d) => d.status)).toEqual([
      "completed",
      "in_progress",
      "skipped",
      "rest",
      "planned",
      "rest",
      "rest",
    ]);
  });

  it("marks past planned workouts as not logged", () => {
    const summary = summarizeWeek([w("2026-09-28")], WEEK_START, TODAY);
    expect(summary.segments).toEqual(["not_logged"]);
    expect(summary.days[0].status).toBe("not_logged");
  });
});

describe("stripStatus", () => {
  it("prefers the most actionable status on a day with several workouts", () => {
    expect(stripStatus([w(TODAY, "completed"), w(TODAY)], TODAY, TODAY)).toBe("planned");
    expect(stripStatus([w(TODAY, "completed"), w(TODAY, "skipped")], TODAY, TODAY)).toBe(
      "completed",
    );
  });
});

describe("lastWeekInsight", () => {
  it("celebrates a complete week", () => {
    expect(lastWeekInsight([w("a", "completed"), w("b", "completed")])).toEqual({
      kind: "allDone",
      count: 2,
    });
  });

  it("reports a partial week and ignores skipped workouts", () => {
    expect(lastWeekInsight([w("a", "completed"), w("b"), w("c", "skipped")])).toEqual({
      kind: "partial",
      done: 1,
      total: 2,
    });
  });

  it("stays quiet when there is nothing encouraging to say", () => {
    expect(lastWeekInsight([])).toBeNull();
    expect(lastWeekInsight([w("a"), w("b", "skipped")])).toBeNull();
  });
});

describe("greeting helpers", () => {
  it("splits the day into morning, afternoon and evening", () => {
    expect([4, 5, 11, 12, 17, 18, 23].map(dayPart)).toEqual([
      "morning",
      "morning",
      "morning",
      "afternoon",
      "afternoon",
      "evening",
      "evening",
    ]);
  });

  it("reads the hour in the user's time zone", () => {
    const now = new Date("2026-09-29T15:20:00Z");
    expect(hourInTimeZone("Europe/Belgrade", now)).toBe(17);
    expect(hourInTimeZone("UTC", now)).toBe(15);
  });

  it("describes when the next workout is", () => {
    expect(whenLabel("2026-09-30", TODAY)).toBe("tomorrow");
    expect(whenLabel("2026-10-04", TODAY)).toBe("weekday");
    expect(whenLabel("2026-10-06", TODAY)).toBe("date");
  });
});

describe("upNextList", () => {
  it("skips the workout the rest card already shows", () => {
    const list = [w("2026-10-01"), w("2026-10-02"), w("2026-10-03"), w("2026-10-04")];
    const state = derive(list);
    expect(state.kind).toBe("rest");
    expect(upNextList(list, TODAY, state).map((x) => x.planned_date)).toEqual([
      "2026-10-02",
      "2026-10-03",
    ]);
  });
});

describe("upNext", () => {
  it("lists at most three future planned workouts, never today", () => {
    const list = upNext(
      [w("2026-10-05"), w(TODAY), w("2026-10-01"), w("2026-10-02"), w("2026-10-03")],
      TODAY,
    );
    expect(list.map((x) => x.planned_date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);
  });
});
