/**
 * Calendar dates are plain ISO strings (YYYY-MM-DD) so they never drift across
 * time zones. Weeks start on Monday; weekdays use ISO numbering (1 = Mon … 7 = Sun).
 */

export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): value is IsoDate {
  if (!ISO_DATE.test(value)) return false;
  const d = toUtcDate(value);
  return !Number.isNaN(d.getTime()) && fromUtcDate(d) === value;
}

/** Date at 00:00 UTC for an ISO date. */
export function toUtcDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

export function fromUtcDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

/** Today's date as seen in the given IANA time zone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): IsoDate {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return fromUtcDate(now);
  }
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = toUtcDate(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtcDate(d);
}

/** ISO weekday: 1 = Monday … 7 = Sunday. */
export function isoWeekday(date: IsoDate): number {
  const day = toUtcDate(date).getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, 1 - isoWeekday(date));
}

export function weekDates(weekStart: IsoDate): IsoDate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / 86_400_000);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts a wall-clock date and time in a time zone to a UTC instant.
 * Handles DST by correcting with the zone offset at the guessed instant.
 */
export function zonedDateTimeToUtc(date: IsoDate, time: string, timeZone: string): Date {
  const [h, m] = time.split(":").map(Number);
  const guess = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
  const offset = timeZoneOffsetMinutes(guess, timeZone);
  const first = new Date(guess.getTime() - offset * 60_000);
  const offset2 = timeZoneOffsetMinutes(first, timeZone);
  return offset2 === offset ? first : new Date(guess.getTime() - offset2 * 60_000);
}

function timeZoneOffsetMinutes(instant: Date, timeZone: string): number {
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

/** Locale-aware formatting for plain dates (always rendered in UTC to avoid shifts). */
export function formatIsoDate(
  date: IsoDate,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { ...options, timeZone: "UTC" }).format(
    toUtcDate(date),
  );
}

export function formatNumber(value: number, locale: string, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits }).format(value);
}

/** Serbian must render in Latin script. */
export function intlLocale(locale: string): string {
  return locale === "sr" ? "sr-Latn-RS" : "en-GB";
}
