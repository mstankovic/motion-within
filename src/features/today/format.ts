import { formatIsoDate, intlLocale, type IsoDate } from "@/lib/dates";

/** "18:04" for a timestamp, in the user's time zone. */
export function clockTime(iso: string, locale: string, timeZone: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

/** "18:00" from a Postgres time ("18:00:00"). */
export function plannedTime(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

/** "28 Sep" / "28. sep" — English keeps three-letter months ("Sept" in newer ICU data). */
export function shortDate(date: IsoDate, locale: string): string {
  const label = formatIsoDate(date, locale, { day: "numeric", month: "short" });
  return locale === "sr" ? label : label.replace(/\b([A-Z][a-z]{2})[a-z]+\b/, "$1");
}
