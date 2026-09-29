/**
 * Pure reminder scheduling rules, shared by the Edge Function (Deno) and unit
 * tests (Vitest). No runtime-specific imports.
 */

export type ReminderCandidate = {
  scheduledWorkoutId: string;
  plannedDate: string; // YYYY-MM-DD in the user's time zone
  plannedTime: string | null; // HH:MM[:SS]
  reminderAt: string | null; // explicit override (ISO)
};

export type ReminderPrefs = {
  timeZone: string;
  minutesBefore: number;
  defaultWorkoutTime: string; // HH:MM[:SS]
  quietStart: string | null;
  quietEnd: string | null;
};

/** How long after the due time a reminder may still be sent (e.g. cron was down). */
export const SEND_WINDOW_MS = 2 * 60 * 60 * 1000;

function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

export function zonedToUtc(date: string, time: string, timeZone: string): Date {
  const [h, m] = time.split(":").map(Number);
  const guess = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
  const first = new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60_000);
  return new Date(guess.getTime() - offsetMinutes(first, timeZone) * 60_000);
}

export function dueAt(c: ReminderCandidate, prefs: ReminderPrefs): Date {
  if (c.reminderAt) return new Date(c.reminderAt);
  const start = zonedToUtc(
    c.plannedDate,
    c.plannedTime ?? prefs.defaultWorkoutTime,
    prefs.timeZone,
  );
  return new Date(start.getTime() - prefs.minutesBefore * 60_000);
}

function minutesOfDay(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function inQuietHours(now: Date, prefs: ReminderPrefs): boolean {
  if (!prefs.quietStart || !prefs.quietEnd) return false;
  const local = new Intl.DateTimeFormat("en-GB", {
    timeZone: prefs.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const cur = minutesOfDay(local);
  const start = minutesOfDay(prefs.quietStart);
  const end = minutesOfDay(prefs.quietEnd);
  if (start === end) return false;
  return start < end ? cur >= start && cur < end : cur >= start || cur < end;
}

/** Whether a reminder should be sent now. Idempotency is enforced separately by the delivery log. */
export function shouldSend(
  c: ReminderCandidate,
  prefs: ReminderPrefs,
  now: Date,
): { send: boolean; due: Date } {
  const due = dueAt(c, prefs);
  const elapsed = now.getTime() - due.getTime();
  const send = elapsed >= 0 && elapsed <= SEND_WINDOW_MS && !inQuietHours(now, prefs);
  return { send, due };
}
