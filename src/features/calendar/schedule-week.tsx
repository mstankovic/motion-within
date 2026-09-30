import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { stripStatus } from "@/features/today/derive";
import { plannedTime } from "@/features/today/format";
import { DateColumn } from "@/features/today/upcoming-list";
import { cn } from "@/lib/cn";
import { weekDates, type IsoDate } from "@/lib/dates";
import type { CalendarWorkout } from "./queries";
import { StatusMark } from "./status-mark";

/** All seven days of a week, each opening its day; empty days stay in the list. */
export async function ScheduleWeek({
  weekStart,
  today,
  workouts,
}: {
  weekStart: IsoDate;
  today: IsoDate;
  workouts: CalendarWorkout[];
}) {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

  return (
    <ol className="bg-surface divide-surface-muted divide-y overflow-hidden rounded-[var(--radius-card)] shadow-(--shadow-card)">
      {weekDates(weekStart).map((date) => {
        const isToday = date === today;
        const items = workouts.filter((w) => w.planned_date === date);
        return (
          <li key={date}>
            <Link
              href={`/calendar/${date}`}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex min-h-18 items-center gap-3.5 py-3.5 pr-3.5 pl-4 transition-colors duration-(--dur-fast)",
                isToday ? "bg-brand-soft active:bg-brand-soft/70" : "active:bg-surface-muted",
              )}
            >
              <DateColumn date={date} locale={locale} />
              <span className="flex min-w-0 flex-1 flex-col gap-2">
                {isToday ? (
                  <span className="text-brand-strong text-[0.8125rem] leading-[1.125rem] font-bold">
                    {t("calendar.today")}
                  </span>
                ) : null}
                {items.length ? (
                  items.map((w) => {
                    const status = stripStatus([w], date, today);
                    return (
                      <span key={w.id} className="flex items-start gap-2.5">
                        <span className="flex h-[1.375rem] shrink-0 items-center">
                          <StatusMark status={status} />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="text-base leading-[1.375rem] font-bold">{w.title}</span>
                          <span className="text-ink-muted text-sm">
                            {[t(`status.${status}`), plannedTime(w.planned_time)]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-ink-muted text-[0.9375rem]">{t("status.rest")}</span>
                )}
              </span>
              <ChevronRight aria-hidden="true" className="text-ink-subtle size-5 shrink-0" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
