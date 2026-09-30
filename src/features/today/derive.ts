/**
 * Today screen: pure derivations from the calendar data (no I/O). Every value on the screen comes
 * from the current tables; see docs/decisions/0007-today-home.md for the rules.
 */
import { addDays, daysBetween, startOfWeek, weekDates, type IsoDate } from "@/lib/dates";
import type { CalendarWorkout } from "@/features/calendar/queries";

export type OpenSession = {
  id: string;
  title_snapshot: string;
  started_at: string;
  scheduled_workout_id: string | null;
};

export type TodayState =
  | { kind: "in_progress"; session: OpenSession; workout: CalendarWorkout | null }
  | { kind: "planned"; workout: CalendarWorkout; plannedToday: number }
  | { kind: "missed"; workout: CalendarWorkout }
  | { kind: "completed"; workout: CalendarWorkout; leftThisWeek: number }
  | { kind: "rest"; next: CalendarWorkout | null }
  | { kind: "unplanned" }
  | { kind: "no_program" };

/** Only what the state rules need from the active program. */
export type ActiveProgram = { id: string } | null;

const byDateTime = (a: CalendarWorkout, b: CalendarWorkout) =>
  a.planned_date.localeCompare(b.planned_date) ||
  (a.planned_time ?? "99").localeCompare(b.planned_time ?? "99");

/**
 * One resolved state for the Today card, in priority order:
 * 1 open session anywhere → in_progress, 2 planned today → planned, 3 a past planned workout
 * earlier this week → missed, 4 today's workout completed → completed, 5 today empty and future
 * workouts exist → rest, 6 active program and an empty week → unplanned, 7 → no_program.
 *
 * `workouts` holds this week plus the look-ahead used for the next workout (any order).
 * Not covered by the rules: nothing today or later but the week has workouts → rest, no next.
 */
export function deriveTodayState(
  workouts: CalendarWorkout[],
  today: IsoDate,
  openSession: OpenSession | null,
  activeProgram: ActiveProgram,
): TodayState {
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const week = workouts.filter((w) => w.planned_date >= weekStart && w.planned_date <= weekEnd);
  const todays = week.filter((w) => w.planned_date === today).sort(byDateTime);

  if (openSession) {
    const workout = workouts.find((w) => w.sessionId === openSession.id) ?? null;
    return { kind: "in_progress", session: openSession, workout };
  }

  const plannedToday = todays.filter((w) => w.status === "planned");
  if (plannedToday.length) {
    return { kind: "planned", workout: plannedToday[0], plannedToday: plannedToday.length };
  }

  const missed = week
    .filter((w) => w.status === "planned" && w.planned_date < today)
    .sort(byDateTime)
    .at(-1);
  if (missed) return { kind: "missed", workout: missed };

  const completedToday = todays.filter((w) => w.status === "completed");
  if (completedToday.length) {
    const leftThisWeek = week.filter(
      (w) => w.status === "planned" && w.planned_date > today,
    ).length;
    return { kind: "completed", workout: completedToday.at(-1)!, leftThisWeek };
  }

  const next = upNext(workouts, today, 1)[0] ?? null;
  if (next) return { kind: "rest", next };
  if (week.length) return { kind: "rest", next: null };
  return activeProgram ? { kind: "unplanned" } : { kind: "no_program" };
}

/** Day marks in the week strip; "not_logged" = a past day that still has a planned workout. */
export type StripStatus =
  "planned" | "in_progress" | "completed" | "not_logged" | "skipped" | "rest";

export function stripStatus(workouts: CalendarWorkout[], date: IsoDate, today: IsoDate) {
  const statuses = workouts.filter((w) => w.planned_date === date).map((w) => w.status);
  if (statuses.includes("in_progress")) return "in_progress";
  if (statuses.includes("planned")) return date < today ? "not_logged" : "planned";
  if (statuses.includes("completed")) return "completed";
  if (statuses.includes("skipped")) return "skipped";
  return "rest";
}

export type WeekSummary = {
  done: number;
  /** Planned workouts that count (skipped ones do not). */
  total: number;
  /** One segment per counted workout, in date order; "1 of 4" and the bar always agree. */
  segments: ("completed" | "in_progress" | "planned" | "not_logged")[];
  days: { date: IsoDate; status: StripStatus }[];
};

export function summarizeWeek(
  workouts: CalendarWorkout[],
  weekStart: IsoDate,
  today: IsoDate,
): WeekSummary {
  const counted = workouts.filter((w) => w.status !== "skipped").sort(byDateTime);
  return {
    done: counted.filter((w) => w.status === "completed").length,
    total: counted.length,
    segments: counted.map((w) =>
      w.status === "planned" && w.planned_date < today
        ? "not_logged"
        : (w.status as "completed" | "in_progress" | "planned"),
    ),
    days: weekDates(weekStart).map((date) => ({
      date,
      status: stripStatus(workouts, date, today),
    })),
  };
}

export type Insight =
  { kind: "allDone"; count: number } | { kind: "partial"; done: number; total: number };

/** One line about last week, or nothing when there was nothing to count. */
export function lastWeekInsight(previousWeek: CalendarWorkout[]): Insight | null {
  const counted = previousWeek.filter((w) => w.status !== "skipped");
  if (!counted.length) return null;
  const done = counted.filter((w) => w.status === "completed").length;
  if (done === counted.length) return { kind: "allDone", count: done };
  if (done === 0) return null;
  return { kind: "partial", done, total: counted.length };
}

export type DayPart = "morning" | "afternoon" | "evening";

export function dayPart(hour: number): DayPart {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/** Hour of day (0–23) in the user's time zone. */
export function hourInTimeZone(timeZone: string, now: Date = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-GB", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).format(now);
  return Number(hour) % 24;
}

/** "tomorrow", a weekday within the next six days, or a date further out. */
export function whenLabel(date: IsoDate, today: IsoDate): "tomorrow" | "weekday" | "date" {
  const days = daysBetween(today, date);
  if (days === 1) return "tomorrow";
  return days > 1 && days < 7 ? "weekday" : "date";
}

/** Up to `limit` planned workouts after today, earliest first. */
export function upNext(workouts: CalendarWorkout[], today: IsoDate, limit = 3) {
  return workouts
    .filter((w) => w.status === "planned" && w.planned_date > today)
    .sort(byDateTime)
    .slice(0, limit);
}

/** The Up next list: on rest days the first one is already in the Today card, so skip it. */
export function upNextList(workouts: CalendarWorkout[], today: IsoDate, state: TodayState) {
  const list = upNext(workouts, today);
  return state.kind === "rest" && state.next ? list.slice(1) : list;
}
