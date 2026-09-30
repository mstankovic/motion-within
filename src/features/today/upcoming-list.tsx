import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import type { CalendarWorkout } from "@/features/calendar/queries";
import { formatIsoDate, type IsoDate } from "@/lib/dates";
import { whenLabel } from "./derive";
import { plannedTime } from "./format";

/** Up to three future planned workouts in one card, plus a link to the full schedule. */
export async function UpcomingList({
  workouts,
  today,
}: {
  workouts: CalendarWorkout[];
  today: IsoDate;
}) {
  if (!workouts.length) return null;
  const [t, labels, locale] = await Promise.all([
    getTranslations("today"),
    rowLabels(),
    getLocale(),
  ]);
  return (
    <section aria-labelledby="next-title" className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-1">
        <h2 id="next-title" className="text-[1.0625rem] leading-6 font-extrabold">
          {t("upNext")}
        </h2>
        <Link
          href="/calendar"
          className="text-brand hover:text-brand-strong -mr-1.5 flex min-h-11 items-center gap-0.5 text-[0.9375rem] font-bold"
        >
          {t("fullSchedule")}
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
        </Link>
      </div>
      <ul className="bg-surface divide-surface-muted divide-y overflow-hidden rounded-[var(--radius-card)] shadow-(--shadow-card)">
        {workouts.map((w) => (
          <li key={w.id}>
            <Link
              href={`/calendar/${w.planned_date}`}
              className="active:bg-surface-muted flex min-h-18 items-center gap-3.5 py-3.5 pr-3.5 pl-4 transition-colors duration-(--dur-fast)"
            >
              <DateColumn date={w.planned_date} locale={locale} />
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="text-brand-strong text-[0.8125rem] leading-[1.125rem] font-bold">
                  {relativeDay(w.planned_date, today, locale, labels.tomorrow)}
                </span>
                <span className="text-base leading-[1.375rem] font-bold">{w.title}</span>
                <span className="text-ink-muted text-sm">{labels.meta(w)}</span>
              </span>
              <ChevronRight aria-hidden="true" className="text-ink-subtle size-5 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 44px column: weekday 12px/700 uppercase over the day number 20/24 800. */
export function DateColumn({ date, locale }: { date: IsoDate; locale: string }) {
  return (
    <span className="flex w-11 shrink-0 flex-col items-center">
      <span className="text-ink-muted text-xs font-bold uppercase">
        {formatIsoDate(date, locale, { weekday: "short" })}
      </span>
      <span className="text-xl leading-6 font-extrabold">{Number(date.slice(8))}</span>
    </span>
  );
}

/** "Tomorrow", a weekday this coming week, or weekday + date further out. */
export function relativeDay(date: IsoDate, today: IsoDate, locale: string, tomorrow: string) {
  const when = whenLabel(date, today);
  if (when === "tomorrow") return tomorrow;
  const label = formatIsoDate(
    date,
    locale,
    when === "weekday" ? { weekday: "long" } : { weekday: "long", day: "numeric", month: "long" },
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Labels shared by rows: "Strong · 8 exercises · 18:00". */
export async function rowLabels() {
  const [tc, ti, tt] = await Promise.all([
    getTranslations("calendar"),
    getTranslations("intensity"),
    getTranslations("today.card"),
  ]);
  return {
    tomorrow: tt("tomorrow"),
    meta: (w: CalendarWorkout) =>
      [
        w.intensity && w.intensity !== "custom" ? ti(w.intensity) : null,
        w.exerciseCount != null ? tc("exerciseCount", { count: w.exerciseCount }) : null,
        plannedTime(w.planned_time),
      ]
        .filter(Boolean)
        .join(" · "),
  };
}
