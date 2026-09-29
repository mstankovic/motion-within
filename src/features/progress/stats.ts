import { addDays, startOfWeek, type IsoDate } from "@/lib/dates";

export type ScheduledLite = {
  planned_date: IsoDate;
  status: "planned" | "in_progress" | "completed" | "skipped";
};
export type SessionLite = {
  started_at: string;
  status: "in_progress" | "completed" | "abandoned";
  session_rpe: number | null;
  energy_after: number | null;
};

export function weekRange(today: IsoDate, offsetWeeks = 0) {
  const start = addDays(startOfWeek(today), offsetWeeks * 7);
  return { start, end: addDays(start, 6) };
}

/** Local (profile time zone) date of a timestamp. */
export function localDate(timestamp: string, timeZone: string): IsoDate {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(timestamp));
  } catch {
    return timestamp.slice(0, 10);
  }
}

export function countCompletedInRange(
  sessions: SessionLite[],
  range: { start: IsoDate; end: IsoDate },
  timeZone: string,
) {
  return sessions.filter((s) => {
    if (s.status !== "completed") return false;
    const d = localDate(s.started_at, timeZone);
    return d >= range.start && d <= range.end;
  }).length;
}

/**
 * Share of planned workouts (up to and including today) that were completed.
 * Future workouts are not counted against the user.
 */
export function adherence(
  scheduled: ScheduledLite[],
  today: IsoDate,
): { completed: number; total: number; percent: number | null } {
  const due = scheduled.filter((s) => s.planned_date <= today);
  const completed = due.filter((s) => s.status === "completed").length;
  const total = due.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : null };
}

/** Weeks (of the last `weeks`, including the current one) with ≥1 completed workout. */
export function weeklyContinuity(
  sessions: SessionLite[],
  today: IsoDate,
  timeZone: string,
  weeks = 8,
): { weekStart: IsoDate; count: number }[] {
  const current = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(current, -7 * (weeks - 1 - i));
    return {
      weekStart: start,
      count: countCompletedInRange(sessions, { start, end: addDays(start, 6) }, timeZone),
    };
  });
}

export function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}
