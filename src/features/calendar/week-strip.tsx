import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { isoWeekday, weekDates, type IsoDate } from "@/lib/dates";
import type { CalendarWorkout } from "./queries";
import { dayStatus, StatusIcon } from "./status";

export function WeekStrip({
  weekStart,
  today,
  workouts,
}: {
  weekStart: IsoDate;
  today: IsoDate;
  workouts: CalendarWorkout[];
}) {
  const t = useTranslations();
  const locale = useLocale();
  return (
    <ol className="grid grid-cols-7 gap-1">
      {weekDates(weekStart).map((date) => {
        const status = dayStatus(
          workouts.filter((w) => w.planned_date === date).map((w) => w.status),
        );
        const isToday = date === today;
        const wd = String(isoWeekday(date)) as "1";
        const dayNumber = Number(date.slice(8));
        const full = new Intl.DateTimeFormat(locale === "sr" ? "sr-Latn-RS" : "en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        }).format(new Date(`${date}T00:00:00Z`));
        return (
          <li key={date}>
            <Link
              href={`/calendar/${date}`}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${full}: ${t(`status.${status}`)}${isToday ? ` (${t("calendar.today")})` : ""}`}
              className={cn(
                "pressable-sm flex min-h-19 flex-col items-center justify-center gap-1 rounded-[var(--radius-control)] border-[1.5px] py-2",
                isToday
                  ? "border-brand bg-brand-soft"
                  : "bg-surface active:bg-surface-muted border-transparent",
              )}
            >
              <span
                className={cn(
                  "text-xs font-semibold",
                  isToday ? "text-brand-strong" : "text-ink-muted",
                )}
              >
                {t(`weekdaysShort.${wd}`)}
              </span>
              <span
                className={cn("text-xl leading-6 font-extrabold", isToday && "text-brand-strong")}
              >
                {dayNumber}
              </span>
              <StatusIcon status={status} className="size-4" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusLegend() {
  const t = useTranslations("status");
  return (
    <ul
      className="text-ink-muted mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs"
      aria-hidden="true"
    >
      {(["planned", "in_progress", "completed", "skipped"] as const).map((s) => (
        <li key={s} className="flex items-center gap-1">
          <StatusIcon status={s} className="size-3.5" />
          {t(s)}
        </li>
      ))}
    </ul>
  );
}
