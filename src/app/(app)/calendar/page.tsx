import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/states";
import { PasskeyOffer } from "@/features/auth/passkey-ui";
import { PlanWeekButton } from "@/features/calendar/plan-week-button";
import {
  getLastCompletedAt,
  getOpenSession,
  getWorkoutsInRange,
  pickTodayWorkout,
} from "@/features/calendar/queries";
import { StatusBadge } from "@/features/calendar/status";
import { StatusLegend, WeekStrip } from "@/features/calendar/week-strip";
import { WorkoutCta } from "@/features/calendar/workout-cta";
import { getActiveProgramDays } from "@/features/programs/queries";
import { isLongBreak } from "@/features/progression/engine";
import { addDays, formatIsoDate, isIsoDate, startOfWeek, todayInTimeZone } from "@/lib/dates";
import { getProfile } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("calendar") };
}

export default async function CalendarPage({ searchParams }: PageProps<"/calendar">) {
  const [t, locale, profile, params] = await Promise.all([
    getTranslations(),
    getLocale(),
    getProfile(),
    searchParams,
  ]);
  const today = todayInTimeZone(profile.timezone);
  const requested = typeof params.week === "string" && isIsoDate(params.week) ? params.week : today;
  const weekStart = startOfWeek(requested);
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = weekStart === startOfWeek(today);

  const [workouts, activeProgram, lastCompletedAt, openSession] = await Promise.all([
    getWorkoutsInRange(weekStart, weekEnd),
    getActiveProgramDays(),
    getLastCompletedAt(),
    getOpenSession(),
  ]);

  const counted = workouts.filter((w) => w.status !== "skipped");
  const done = workouts.filter((w) => w.status === "completed").length;
  const todayWorkout = pickTodayWorkout(workouts.filter((w) => w.planned_date === today));
  const openElsewhere =
    openSession && openSession.id !== todayWorkout?.sessionId ? openSession : null;
  const hasPlannableDays = activeProgram?.program_days.some((d) => d.preferred_weekday != null);

  return (
    <>
      <header className="mb-3 flex items-center gap-1">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            {isCurrentWeek
              ? t("calendar.title")
              : t("calendar.weekOf", {
                  date: formatIsoDate(weekStart, locale, { day: "numeric", month: "long" }),
                })}
          </h1>
          <p className="text-ink-muted text-sm">
            {formatIsoDate(weekStart, locale, { day: "numeric", month: "short" })} –{" "}
            {formatIsoDate(weekEnd, locale, { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <Button asChild size="icon" variant="ghost">
          <Link
            href={`/calendar?week=${addDays(weekStart, -7)}`}
            aria-label={t("calendar.previousWeek")}
          >
            <ChevronLeft aria-hidden="true" />
          </Link>
        </Button>
        {!isCurrentWeek ? (
          <Button asChild size="sm" variant="outline">
            <Link href="/calendar">{t("calendar.thisWeek")}</Link>
          </Button>
        ) : null}
        <Button asChild size="icon" variant="ghost">
          <Link
            href={`/calendar?week=${addDays(weekStart, 7)}`}
            aria-label={t("calendar.nextWeek")}
          >
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <WeekStrip weekStart={weekStart} today={today} workouts={workouts} />
      <StatusLegend />

      <p className="mt-3 mb-4 text-center text-sm font-semibold" role="status">
        {counted.length
          ? t("calendar.weekProgress", { done, planned: counted.length })
          : t("calendar.weekProgressNone")}
      </p>

      {openElsewhere ? (
        <Notice tone="warning" className="mb-4 flex items-center justify-between gap-3">
          <span>
            {t("workout.unfinished")} <strong>{openElsewhere.title_snapshot}</strong>
          </span>
          <Button asChild size="sm" variant="outline">
            <Link href={`/sessions/${openElsewhere.id}`}>
              <RotateCcw aria-hidden="true" />
              {t("calendar.continue")}
            </Link>
          </Button>
        </Notice>
      ) : null}

      {isCurrentWeek && isLongBreak(lastCompletedAt) ? (
        <Notice className="mb-4">{t("calendar.longBreak")}</Notice>
      ) : null}

      {isCurrentWeek ? (
        <section aria-labelledby="today-title" className="mb-5">
          <Card className="p-5">
            <h2
              id="today-title"
              className="text-ink-muted text-sm font-bold tracking-wide uppercase"
            >
              {t("calendar.todayCard")} ·{" "}
              {formatIsoDate(today, locale, { weekday: "long", day: "numeric", month: "long" })}
            </h2>
            {todayWorkout ? (
              <>
                <p className="mt-1 text-2xl font-extrabold tracking-tight">{todayWorkout.title}</p>
                <div className="mt-2 mb-4 flex flex-wrap gap-1.5">
                  <StatusBadge status={todayWorkout.status} />
                  {todayWorkout.intensity ? (
                    <Badge tone="brand">{t(`intensity.${todayWorkout.intensity}`)}</Badge>
                  ) : null}
                  {todayWorkout.exerciseCount != null ? (
                    <Badge>
                      {t("calendar.exerciseCount", { count: todayWorkout.exerciseCount })}
                    </Badge>
                  ) : null}
                </div>
                <WorkoutCta workout={todayWorkout} />
              </>
            ) : (
              <>
                <p className="mt-1 text-xl font-bold">{t("calendar.noWorkoutToday")}</p>
                <p className="text-ink-muted mt-1 mb-4 text-sm">
                  {t("calendar.noWorkoutTodayBody")}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/calendar/${today}`}>
                    <Plus aria-hidden="true" />
                    {t("calendar.addWorkout")}
                  </Link>
                </Button>
              </>
            )}
          </Card>
        </section>
      ) : null}

      <PasskeyOffer className="mb-5" />

      {!activeProgram ? (
        <EmptyState
          title={t("calendar.noActiveProgram")}
          action={
            <Button asChild>
              <Link href="/programs">{t("calendar.createProgram")}</Link>
            </Button>
          }
        />
      ) : workouts.length === 0 && hasPlannableDays ? (
        <PlanWeekButton weekStart={weekStart} />
      ) : null}

      {workouts.length ? (
        <section aria-labelledby="week-list" className="mt-2">
          <h2
            id="week-list"
            className="text-ink-muted mb-2 text-sm font-bold tracking-wide uppercase"
          >
            {t("calendar.day.title")}
          </h2>
          <ul className="space-y-2">
            {workouts.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/calendar/${w.planned_date}`}
                  className="bg-surface active:bg-surface-muted flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] px-4 py-3 shadow-[var(--shadow-card)] transition-colors duration-(--dur-fast)"
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-ink-muted text-xs font-semibold uppercase">
                      {formatIsoDate(w.planned_date, locale, { weekday: "short" })}
                    </p>
                    <p className="text-lg leading-none font-extrabold">
                      {Number(w.planned_date.slice(8))}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{w.title}</p>
                    <div className="mt-0.5 flex gap-1">
                      <StatusBadge status={w.status} />
                      {w.planned_time ? <Badge>{w.planned_time.slice(0, 5)}</Badge> : null}
                    </div>
                  </div>
                  <ChevronRight aria-hidden="true" className="text-ink-subtle size-5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
