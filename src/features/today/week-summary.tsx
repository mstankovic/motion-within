import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { StatusMark } from "@/features/calendar/status-mark";
import type { CalendarWorkout } from "@/features/calendar/queries";
import { cn } from "@/lib/cn";
import { addDays, formatIsoDate, intlLocale, isoWeekday, type IsoDate } from "@/lib/dates";
import type { Insight, WeekSummary as Summary } from "./derive";
import { shortDate } from "./format";
import { WeekSegments } from "./week-segments";

/** Count, segmented bar, 7-day strip and one insight. Arrows swap only this card. */
export async function WeekSummary({
  summary,
  workouts,
  weekStart,
  today,
  isCurrentWeek,
  insight,
}: {
  summary: Summary;
  /** Workouts of the shown week, for the day tiles' accessible names. */
  workouts: CalendarWorkout[];
  weekStart: IsoDate;
  today: IsoDate;
  isCurrentWeek: boolean;
  insight: Insight | null;
}) {
  const [t, tw, tc, locale] = await Promise.all([
    getTranslations(),
    getTranslations("today.week"),
    getTranslations("calendar"),
    getLocale(),
  ]);
  const weekEnd = addDays(weekStart, 6);
  const dayName = new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
  const arrow =
    "hover:bg-surface-muted active:bg-surface-muted flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-(--dur-fast)";

  return (
    <section
      aria-labelledby="week-title"
      className="bg-surface flex flex-col gap-3.5 rounded-[var(--radius-card)] px-3 pt-4 pb-3.5 shadow-(--shadow-card)"
    >
      <div className="flex items-center gap-1 px-1">
        <div className="min-w-0 flex-1">
          <h2 id="week-title" className="text-[1.0625rem] leading-6 font-extrabold">
            {isCurrentWeek
              ? tc("title")
              : tc("weekOf", {
                  date: formatIsoDate(weekStart, locale, { day: "numeric", month: "long" }),
                })}
          </h2>
          <p className="text-ink-muted text-[0.8125rem] leading-[1.125rem]">
            {shortDate(weekStart, locale)} – {shortDate(weekEnd, locale)}
          </p>
        </div>
        {!isCurrentWeek ? (
          <Link
            href="/today"
            scroll={false}
            className="border-border bg-surface pressable inline-flex h-9 items-center rounded-full border px-3 text-[0.8125rem] font-bold"
          >
            {tc("thisWeek")}
          </Link>
        ) : null}
        <Link
          href={`/today?week=${addDays(weekStart, -7)}`}
          scroll={false}
          aria-label={tc("previousWeek")}
          className={arrow}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Link>
        <Link
          href={`/today?week=${addDays(weekStart, 7)}`}
          scroll={false}
          aria-label={tc("nextWeek")}
          className={cn(arrow, "-mr-2")}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </Link>
      </div>

      {summary.total ? (
        <div className="flex flex-col gap-2.5 px-1" role="status">
          <p className="flex items-baseline gap-1.5">
            <span className="text-[1.75rem] leading-8 font-extrabold tracking-[-0.02em]">
              {summary.done}
            </span>
            <span className="text-ink-muted text-[0.9375rem] font-bold">
              {tw("doneOf", { total: summary.total })}
            </span>
          </p>
          <WeekSegments segments={summary.segments} />
        </div>
      ) : null}

      <ol className="grid grid-cols-7 gap-0.5">
        {summary.days.map(({ date, status }) => {
          const isToday = date === today;
          const titles = workouts
            .filter((w) => w.planned_date === date)
            .map((w) => w.title)
            .join(", ");
          const name = `${dayName.format(new Date(`${date}T00:00:00Z`))}: ${titles ? `${titles}, ` : ""}${t(`status.${status}`)}${isToday ? ` (${tw("todayMark")})` : ""}`;
          return (
            <li key={date}>
              <Link
                href={`/calendar/${date}`}
                aria-label={name}
                aria-current={isToday ? "date" : undefined}
                className={cn(
                  "pressable-sm flex min-h-17 flex-col items-center justify-center gap-[3px] rounded-[var(--radius-control)] border-[1.5px] py-1.5",
                  isToday
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "active:bg-surface-muted border-transparent",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-bold",
                    isToday ? "text-brand-strong" : "text-ink-muted",
                  )}
                >
                  {t(`weekdaysShort.${isoWeekday(date)}` as "weekdaysShort.1")}
                </span>
                <span className="text-[1.0625rem] leading-5 font-extrabold">
                  {Number(date.slice(8))}
                </span>
                <span className="flex h-[1.125rem] items-center justify-center">
                  <StatusMark status={status} />
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {isCurrentWeek && insight ? (
        <div className="border-surface-muted mx-1 flex items-center gap-2.5 border-t pt-3">
          <span className="bg-brand-soft text-brand-strong flex size-8 shrink-0 items-center justify-center rounded-full">
            <TrendingUp aria-hidden="true" className="size-4" />
          </span>
          <p className="text-sm font-semibold text-pretty">
            {insight.kind === "allDone"
              ? tw("insightAllDone", { count: insight.count })
              : tw("insightPartial", { done: insight.done, total: insight.total })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
