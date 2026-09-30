import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ChartNoAxesColumn,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ListChecks,
  Moon,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/badge";
import type { CalendarWorkout } from "@/features/calendar/queries";
import { cn } from "@/lib/cn";
import { formatIsoDate, intlLocale, type IsoDate } from "@/lib/dates";
import type { TodayState } from "./derive";
import { clockTime, plannedTime } from "./format";
import { primaryClass, secondaryClass } from "./styles";
import { HeroAction, MissedActions, PlanWeekAction, StarterAction } from "./today-actions";
import { DateColumn, relativeDay, rowLabels } from "./upcoming-list";

export type TodayProgram = {
  name: string;
  program_days: {
    id: string;
    title: string;
    intensity: CalendarWorkout["intensity"];
    preferred_weekday: number | null;
  }[];
} | null;

type Props = {
  state: TodayState;
  today: IsoDate;
  weekStart: IsoDate;
  timeZone: string;
  progress: { done: number; total: number } | null;
  program: TodayProgram;
};

/** The day's answer and its one primary action. */
export async function TodayCard({ state, today, weekStart, timeZone, progress, program }: Props) {
  const [t, tc, ti, tAll, locale] = await Promise.all([
    getTranslations("today.card"),
    getTranslations("calendar"),
    getTranslations("intensity"),
    getTranslations(),
    getLocale(),
  ]);
  const focus = (w: CalendarWorkout | null) =>
    w?.intensity && w.intensity !== "custom" ? ti(w.intensity) : null;

  switch (state.kind) {
    case "planned": {
      const w = state.workout;
      const time = plannedTime(w.planned_time);
      return (
        <Hero
          eyebrow={time ? t("todayAt", { time }) : t("today")}
          pill={focus(w)}
          title={w.title}
          meta={w.exerciseCount != null ? tc("exerciseCount", { count: w.exerciseCount }) : null}
          action={
            w.program_day_id ? <HeroAction href={`/workouts/${w.id}/start`} kind="start" /> : null
          }
          view={{ href: `/calendar/${w.planned_date}`, label: t("viewWorkout") }}
        />
      );
    }

    case "in_progress": {
      const w = state.workout;
      return (
        <Hero
          eyebrow={t("inProgressSince", {
            time: clockTime(state.session.started_at, locale, timeZone),
          })}
          mark={<LiveDot className="bg-accent-bright" />}
          pill={focus(w)}
          title={state.session.title_snapshot}
          meta={progress ? t("exercisesDone", progress) : t("inProgress")}
          progress={progress}
          action={<HeroAction href={`/sessions/${state.session.id}`} kind="continue" />}
          view={w ? { href: `/calendar/${w.planned_date}`, label: t("viewWorkout") } : null}
        />
      );
    }

    case "completed": {
      const w = state.workout;
      return (
        <Hero
          eyebrow={
            w.completedAt
              ? t("completedAt", { time: clockTime(w.completedAt, locale, timeZone) })
              : tc("todayCard")
          }
          mark={
            <CircleCheck
              aria-hidden="true"
              className="text-success-bright size-4"
              strokeWidth={2.6}
            />
          }
          pill={focus(w)}
          title={w.title}
          meta={
            progress
              ? t("exercisesDone", progress)
              : w.exerciseCount != null
                ? tc("exerciseCount", { count: w.exerciseCount })
                : null
          }
          action={
            w.sessionId ? (
              <Button
                asChild
                size="lg"
                className={cn(primaryClass, "bg-on-hero text-brand-strong dark:text-hero")}
              >
                <Link href={`/sessions/${w.sessionId}`}>
                  <ChartNoAxesColumn aria-hidden="true" strokeWidth={2.4} />
                  {tc("viewSummary")}
                </Link>
              </Button>
            ) : null
          }
          view={{ href: `/calendar/${w.planned_date}`, label: t("viewWorkout") }}
        />
      );
    }

    case "rest": {
      const next = state.next;
      const labels = await rowLabels();
      return (
        <section
          aria-labelledby="today-title"
          className="bg-brand-soft flex flex-col gap-4 rounded-[var(--radius-sheet)] p-5"
        >
          <div className="flex items-center gap-3">
            <span className="bg-surface text-brand-strong flex size-11 shrink-0 items-center justify-center rounded-full">
              <Moon aria-hidden="true" className="size-[1.375rem]" />
            </span>
            <Eyebrow className="text-brand-strong">{t("recovery")}</Eyebrow>
          </div>
          <div className="flex flex-col gap-1.5">
            <Title id="today-title" className="text-brand-strong">
              {t("restTitle")}
            </Title>
            <Body className="text-ink">{t("restBody")}</Body>
          </div>
          {next ? (
            <Link
              href={`/calendar/${next.planned_date}`}
              className="bg-surface text-ink flex items-center gap-3.5 rounded-[var(--radius-row)] py-3.5 pr-3.5 pl-4 shadow-(--shadow-card) transition-transform duration-(--dur-fast) active:scale-[0.985]"
            >
              <DateColumn date={next.planned_date} locale={locale} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-brand-strong text-[0.8125rem] font-bold">
                  {t("nextWorkout")} ·{" "}
                  {relativeDay(next.planned_date, today, locale, labels.tomorrow)}
                </span>
                <span className="text-base leading-[1.375rem] font-bold">{next.title}</span>
                <span className="text-ink-muted text-sm">{labels.meta(next)}</span>
              </span>
              <ChevronRight aria-hidden="true" className="text-ink-subtle size-5 shrink-0" />
            </Link>
          ) : null}
          <Link
            href={`/calendar/${today}`}
            className="border-brand-line text-brand-strong pressable flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] border text-[0.9375rem] font-bold"
          >
            <Plus aria-hidden="true" className="size-[1.125rem]" strokeWidth={2.4} />
            {t("addWorkoutToday")}
          </Link>
        </section>
      );
    }

    case "missed": {
      const w = state.workout;
      return (
        <section
          aria-labelledby="today-title"
          className="bg-surface flex flex-col gap-4 rounded-[var(--radius-sheet)] px-5 pt-5 pb-3 shadow-(--shadow-raised)"
        >
          <span className="bg-warning-soft text-warning inline-flex h-7 items-center gap-1.5 self-start rounded-full px-[0.6875rem] text-[0.8125rem] font-bold">
            <CircleAlert aria-hidden="true" className="size-[0.9375rem]" strokeWidth={2.4} />
            {t("notLogged", { day: formatIsoDate(w.planned_date, locale, { weekday: "long" }) })}
          </span>
          <div className="flex flex-col gap-1.5">
            <Title id="today-title">{w.title}</Title>
            <Body className="text-ink-muted">{t("missedBody")}</Body>
          </div>
          <MissedActions id={w.id} today={today} time={w.planned_time?.slice(0, 5) ?? null} />
        </section>
      );
    }

    case "unplanned": {
      const days = (program?.program_days ?? [])
        .filter((d) => d.preferred_weekday != null)
        .sort((a, b) => a.preferred_weekday! - b.preferred_weekday!);
      const names = new Intl.ListFormat(intlLocale(locale), { type: "conjunction" }).format(
        days.map((d) =>
          formatIsoDate(weekdayDate(d.preferred_weekday!), locale, { weekday: "long" }),
        ),
      );
      return (
        <section
          aria-labelledby="today-title"
          className="bg-brand-soft flex flex-col gap-4 rounded-[var(--radius-sheet)] px-5 pt-5 pb-3"
        >
          {program ? <Eyebrow className="text-brand-strong">{program.name}</Eyebrow> : null}
          <div className="flex flex-col gap-1.5">
            <Title id="today-title" className="text-brand-strong">
              {t("planTitle")}
            </Title>
            <Body className="text-ink">
              {days.length ? t("planBody", { days: names }) : t("planBodyNoDays")}
            </Body>
          </div>
          {days.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {days.map((d) => (
                <li
                  key={d.id}
                  className="bg-surface inline-flex min-h-8 items-center rounded-full px-3 text-sm font-bold"
                >
                  {tAll(`weekdaysShort.${d.preferred_weekday}` as "weekdaysShort.1")} ·{" "}
                  {d.intensity && d.intensity !== "custom" ? ti(d.intensity) : d.title}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex flex-col gap-0.5">
            <PlanWeekAction weekStart={weekStart} />
            <Link href={`/calendar/${today}`} className={cn(secondaryClass, "text-brand-strong")}>
              {t("addSingle")}
            </Link>
          </div>
        </section>
      );
    }

    case "no_program":
      return (
        <HeroSurface className="gap-4 pt-[1.375rem]">
          <Eyebrow className="text-on-hero-muted relative">{t("starterEyebrow")}</Eyebrow>
          <div className="relative flex flex-col gap-2">
            <Title id="today-title" className="text-balance">
              {t("starterTitle")}
            </Title>
            <Body className="text-on-hero-soft">{t("starterBody")}</Body>
          </div>
          <div className="relative flex flex-col gap-0.5">
            <StarterAction />
            <Link
              href="/programs/new"
              className={cn(secondaryClass, "text-on-hero-muted hover:text-on-hero")}
            >
              {t("buildOwn")}
            </Link>
          </div>
        </HeroSurface>
      );
  }
}

/** Deep-teal surface shared with the welcome screen, with the mark's rings top-right. */
function HeroSurface({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="today-title"
      className={cn(
        "bg-hero text-on-hero relative flex flex-col overflow-hidden rounded-[var(--radius-sheet)] px-5 pt-5 pb-3 shadow-(--shadow-raised)",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 220 220"
        className="text-on-hero pointer-events-none absolute -top-20 -right-[4.375rem] size-[13.75rem]"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.07"
        strokeWidth="2"
      >
        <circle cx="110" cy="110" r="108" />
        <circle cx="110" cy="110" r="80" />
        <circle cx="110" cy="110" r="52" />
      </svg>
      {children}
    </section>
  );
}

/** Planned / in progress / completed. */
function Hero({
  eyebrow,
  mark,
  pill,
  title,
  meta,
  progress,
  action,
  view,
}: {
  eyebrow: string;
  mark?: React.ReactNode;
  pill: string | null;
  title: string;
  meta: string | null;
  progress?: { done: number; total: number } | null;
  action: React.ReactNode;
  view: { href: string; label: string } | null;
}) {
  return (
    <HeroSurface className="gap-[1.125rem]">
      <div className="relative flex items-center justify-between gap-3">
        <Eyebrow className="text-on-hero-muted flex items-center gap-2">
          {mark}
          <span>{eyebrow}</span>
        </Eyebrow>
        {pill ? (
          <span className="bg-on-hero/12 inline-flex h-7 shrink-0 items-center rounded-full px-[0.6875rem] text-[0.8125rem] font-bold">
            {pill}
          </span>
        ) : null}
      </div>
      <div className="relative flex flex-col gap-2">
        <Title id="today-title" className="text-balance">
          {title}
        </Title>
        {meta ? (
          <p className="text-on-hero-soft flex items-center gap-2 text-[0.9375rem] font-semibold">
            <ListChecks aria-hidden="true" className="size-[1.125rem] shrink-0" />
            <span>{meta}</span>
          </p>
        ) : null}
      </div>
      {progress ? (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={progress.done}
          aria-label={meta ?? undefined}
          className="bg-on-hero/16 relative h-1.5 overflow-hidden rounded-[3px]"
        >
          <div
            className="bg-accent-bright h-full rounded-[3px] transition-[width] duration-(--dur-slow)"
            style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
          />
        </div>
      ) : null}
      <div className="relative flex flex-col gap-0.5">
        {action}
        {view ? (
          <Link
            href={view.href}
            className={cn(secondaryClass, "text-on-hero-muted hover:text-on-hero gap-1")}
          >
            {view.label}
            <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.4} />
          </Link>
        ) : null}
      </div>
    </HeroSurface>
  );
}

function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "text-[0.8125rem] leading-[1.125rem] font-bold tracking-[0.06em] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

function Title({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "text-[1.75rem] leading-[2.125rem] font-extrabold tracking-[-0.02em]",
        className,
      )}
    >
      {children}
    </h2>
  );
}

function Body({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-[0.9375rem] leading-[1.375rem] text-pretty", className)}>{children}</p>
  );
}

/** A date whose ISO weekday is `isoDay` (2024-01-01 was a Monday). */
function weekdayDate(isoDay: number): IsoDate {
  return `2024-01-${String(isoDay).padStart(2, "0")}`;
}
